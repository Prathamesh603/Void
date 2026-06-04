"""
API routes for Research Agent
"""
from fastapi import APIRouter, HTTPException
from starlette.responses import FileResponse
from datetime import datetime
import json
import os

from api.models import (
    CreateUserRequest, UserResponse, UsersResponse, CreateSessionRequest, SessionResponse, ChatRequest, ChatResponse,
    PDFDownloadRequest, PDFListResponse, PDFInfo, RAGQueryRequest, RAGQueryResponse,
    RAGChunk, ToolCall
)
from agent.agent import invoke_agent
from agent.state import AgentState
from core.database_manager import db
from core.pdf_handler import process_pdf, delete_pdf
from core.vector_store import add_to_vector_store, query_vector_store
from langchain_core.messages import HumanMessage
from utils.logger import logger
from config.settings import PDF_DIR

router = APIRouter(prefix="/api", tags=["research-agent"])

# Root endpoint
@router.get("/")
async def root():
    """Root API endpoint"""
    return {"message": "Research Agent API is running", "version": "1.0.0"}

# =================== SESSION ROUTES ===================
#create user
@router.post("/users/{user_id}",response_model=UserResponse)
def create_users(request: CreateUserRequest):
    """Create new user"""
    try:
        response = db.create_user(request.user_id,
                              request.email)
        logger.info(f"Created user {request.user_id}")
        return UserResponse(
            user_id=request.user_id,
            email=request.email,
            status=response
        )
    
    except Exception as e:
        logger.error(f"Error listing sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Create session (frontend compatible)
@router.post("/sessions", response_model=SessionResponse)
async def create_session_frontend(request: CreateSessionRequest):
    """Create a new research session (frontend compatible)"""
    try:
        title = request.session_name

        # ✅ CHECK USER FIRST
        user = db.get_user(request.user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User does not exist"
            )

        session_id = db.create_session(
            user_id=request.user_id,
            session_name=title,
            topic=title[:50]
        )
        
        logger.info(f"Created session {session_id}")
        
        session = db.get_session(session_id)
        return SessionResponse(
            session_id=session_id,
            user_id=request.user_id,
            session_name=session.get("session_name", title) if session else title,
            created_at=session.get("created_at", datetime.now().isoformat()) if session else datetime.now().isoformat(),
            conversation_topic=session.get("conversation_topic") if session else None
        )
    
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
#List all users
@router.get("/users")
async def list_users():
    """List all users"""
    try:
        all_users = db.list_users()

        return [
            UsersResponse(
                user_id=user["user_id"],
                email=user["email"],
                created_at=user["created_at"]
            )
            for user in (all_users if all_users else [])
        ]

    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
# List all sessions of user 
@router.get("/sessions/{user_id}")
async def list_sessions(user_id: str):
    """List all sessions"""
    try:
        # Get all sessions for default user
        all_sessions = db.list_sessions(user_id)
        return [
            SessionResponse(
                session_id=s.get("session_id"),
                user_id=s.get("user_id", "default_user"),
                session_name=s.get("session_name"),
                created_at=s.get("created_at"),
                conversation_topic=s.get("conversation_topic")
            )
            for s in (all_sessions if all_sessions else [])
        ]
    
    except Exception as e:
        logger.error(f"Error listing sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    

#Get session details
@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get session details"""
    try:
        session = db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return SessionResponse(
            session_id=session.get("session_id"),
            user_id=session.get("user_id", "default_user"),
            session_name=session.get("session_name"),
            created_at=session.get("created_at"),
            conversation_topic=session.get("conversation_topic")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Get session messages (for frontend)
@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str):
    """Get all messages in a session"""
    try:
        history = db.get_conversation_history(session_id)
        
        # Format messages for frontend
        messages = []
        for msg in history:
            if msg.get("user_message"):
                messages.append({
                    "role": "user",
                    "content": msg.get("user_message")
                })
            if msg.get("agent_response"):
                messages.append({
                    "role": "assistant",
                    "content": msg.get("agent_response")
                })
        
        return messages
    
    except Exception as e:
        logger.error(f"Error getting messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Chat endpoint (session-specific, for frontend)
@router.post("/sessions/{session_id}/chat", response_model=ChatResponse)
async def chat_session(session_id: str, request: ChatRequest):
    """Send a message in a session (frontend compatible)"""
    try:
        message_text = request.message
        
        if not message_text:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Load previous messages for this session
        history = db.get_conversation_history(session_id)
        
        # Load papers in session
        papers = db.get_papers(session_id)
        
        # Build initial state
        messages = [HumanMessage(content=message_text)]
        
        state = AgentState(
            messages=messages,
            session_id=session_id,
            user_id="default_user",
            session_pdfs=papers,
            rag_context=[]
        )
        
        # Invoke agent
        result = invoke_agent(state, session_id)
        
        # Extract response
        last_message = result["messages"][-1]
        response_text = last_message.content if hasattr(last_message, "content") else str(last_message)
        
        # Get tools used
        tools_used = []
        tools_used_for_db = []
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            for tool_call in last_message.tool_calls:
                tool_name = tool_call.get("name") if isinstance(tool_call, dict) else getattr(tool_call, "name", "unknown")
                tools_used.append(ToolCall(
                    tool_name=tool_name,
                    status="executed"
                ))
                tools_used_for_db.append({
                    "tool_name": tool_name,
                    "status": "executed"
                })
        
        # Save to database
        db.save_message(
            session_id=session_id,
            user_message=message_text,
            agent_response=response_text,
            tools_used=json.dumps(tools_used_for_db) if tools_used_for_db else None
        )
        
        logger.info(f"Chat completed for session {session_id}")
        
        return ChatResponse(
            session_id=session_id,
            response=response_text,
            tools_used=tools_used if tools_used else None,
            timestamp=datetime.now().isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Delete session (for frontend)
@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    try:
        # Delete session from database
        db.delete_session(session_id)
        
        logger.info(f"Session deleted: {session_id}")
        
        return {"status": "success", "message": f"Session {session_id} deleted"}
    
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



# =================== LEGACY ROUTES (kept for compatibility) ===================

@router.post("/chat", response_model=ChatResponse)
async def chat_legacy(request: ChatRequest):
    """Send a message and get agent response (legacy route)"""
    try:
        # Load previous messages for this session
        history = db.get_conversation_history(request.session_id)
        
        # Load papers in session
        papers = db.get_papers(request.session_id)
        
        # Build initial state
        messages = [HumanMessage(content=request.message)]
        
        state = AgentState(
            messages=messages,
            session_id=request.session_id,
            user_id="default_user",  # TODO: Get from auth
            session_pdfs=papers,
            rag_context=[]
        )
        
        # Invoke agent
        result = invoke_agent(state, request.session_id)
        
        # Extract response
        last_message = result["messages"][-1]
        response_text = last_message.content if hasattr(last_message, "content") else str(last_message)
        
        # Get tools used
        tools_used = []
        tools_used_for_db = []
        last_msg = result["messages"][-1]
        if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
            for tool_call in last_msg.tool_calls:
                tool_name = tool_call.get("name") if isinstance(tool_call, dict) else getattr(tool_call, "name", "unknown")
                tools_used.append(ToolCall(
                    tool_name=tool_name,
                    status="executed"
                ))
                tools_used_for_db.append({
                    "tool_name": tool_name,
                    "status": "executed"
                })
        
        # Save to database
        db.save_message(
            session_id=request.session_id,
            user_message=request.message,
            agent_response=response_text,
            tools_used=json.dumps(tools_used_for_db) if tools_used_for_db else None
        )
        
        logger.info(f"Chat completed for session {request.session_id}")
        
        return ChatResponse(
            session_id=request.session_id,
            response=response_text,
            tools_used=tools_used,
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get conversation history for a session"""
    try:
        history = db.get_conversation_history(session_id)
        return {"session_id": session_id, "messages": history}
    
    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

#Get Papers of particular session
@router.get("/papers/{session_id}")
async def get_session_papers(session_id: str):
    """Get all papers (from arxiv searches) in a session"""
    try:
        papers = db.get_papers(session_id)
        
        papers_data = [
            {
                "paper_id": paper.get("paper_id"),
                "arxiv_id": paper.get("arxiv_id"),
                "title": paper.get("title"),
                "authors": paper.get("authors"),
                "summary": paper.get("summary"),
                "pdf_url": paper.get("pdf_url"),
                "published_date": paper.get("published_date"),
                "stored_at": paper.get("stored_at")
            }
            for paper in papers
        ]
        
        return {
            "session_id": session_id,
            "count": len(papers_data),
            "papers": papers_data
        }
    
    except Exception as e:
        logger.error(f"Error getting papers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

#Get the particular paper
@router.get("/paper/{session_id}/{arxiv_id}")
async def get_paper_details(session_id: str, arxiv_id: str):
    """Get specific paper details"""
    try:
        papers = db.get_papers(session_id)
        
        for paper in papers:
            if paper.get("arxiv_id") == arxiv_id:
                return {
                    "paper_id": paper.get("paper_id"),
                    "arxiv_id": paper.get("arxiv_id"),
                    "title": paper.get("title"),
                    "authors": paper.get("authors"),
                    "summary": paper.get("summary"),
                    "pdf_url": paper.get("pdf_url"),
                    "published_date": paper.get("published_date"),
                    "stored_at": paper.get("stored_at")
                }
        
        raise HTTPException(status_code=404, detail="Paper not found")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting paper: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =================== PDF ROUTES ===================
#Download the PDF
@router.post("/pdf/download")
async def download_pdf(request: PDFDownloadRequest):
    """Download and store PDF from arxiv"""
    try:
        # Process PDF (download, extract, chunk)
        chunks, metadatas = process_pdf(
            pdf_url=request.pdf_url,
            pdf_id=request.paper_id,
            title=request.title
        )
        
        # Add to vector store for RAG
        add_to_vector_store(request.paper_id, chunks, metadatas)
        
        # Save PDF metadata to DB
        db.save_pdf(
            paper_id=request.paper_id,
            session_id=request.session_id,
            pdf_id=request.paper_id,
            file_path=f"data/pdfs/{request.paper_id}.pdf",
            file_size=0,  # TODO: Get actual file size
            vector_store_id=request.paper_id
        )
        
        logger.info(f"PDF stored: {request.paper_id}")
        
        return {
            "status": "success",
            "message": f"PDF '{request.title}' downloaded and indexed",
            "pdf_id": request.paper_id,
            "chunks": len(chunks)
        }
    
    except Exception as e:
        logger.error(f"Error downloading PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pdf/list/{session_id}", response_model=PDFListResponse)
async def list_pdfs(session_id: str):
    """List all PDFs in a session"""
    try:
        pdfs = db.get_pdfs(session_id)
        
        pdf_infos = [
            PDFInfo(
                pdf_id=pdf["pdf_id"],
                title=pdf["title"],
                arxiv_id=pdf["arxiv_id"],
                download_date=pdf["download_date"],
                file_size=pdf.get("file_size")
            )
            for pdf in pdfs
        ]
        
        return PDFListResponse(
            session_id=session_id,
            pdfs=pdf_infos
        )
    
    except Exception as e:
        logger.error(f"Error listing PDFs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/pdf/{pdf_id}")
async def delete_pdf_route(pdf_id: str):
    """Delete a PDF from session"""
    try:
        delete_pdf(pdf_id)
        db.delete_pdf(pdf_id)
        
        logger.info(f"PDF deleted: {pdf_id}")
        
        return {"status": "success", "message": "PDF deleted"}
    
    except Exception as e:
        logger.error(f"Error deleting PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pdf/view/{pdf_id}")
async def view_pdf(pdf_id: str):
    """Retrieve PDF file for viewing/downloading"""
    try:
        pdf_path = PDF_DIR / f"{pdf_id}.pdf"
        
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=f"{pdf_id}.pdf"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =================== RAG ROUTES ===================

@router.post("/pdf/query", response_model=RAGQueryResponse)
async def query_pdf(request: RAGQueryRequest):
    """Query stored PDFs for relevant information"""
    try:
        results = query_vector_store(
            query=request.query,
            pdf_id=request.pdf_id,
            top_k=5
        )
        
        chunks = []
        for result in results:
            chunks.append(RAGChunk(
                content=result["content"],
                source=result["metadata"].get("title", "Unknown"),
                page=result["metadata"].get("page", "N/A"),
                relevance_score=f"{result['score']:.2f}"
            ))
        
        return RAGQueryResponse(
            status="success",
            chunks_found=len(chunks),
            chunks=chunks
        )
    
    except Exception as e:
        logger.error(f"Error querying PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =================== HEALTH CHECK ===================

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Research Agent Backend is running"}
