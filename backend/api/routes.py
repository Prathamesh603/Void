"""
API routes for Research Agent
"""
import asyncio
import json
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from starlette.responses import FileResponse

from api.models import (
    RegisterRequest, LoginRequest, AuthResponse, UserProfileResponse,
    CreateSessionRequest, SessionResponse, ChatRequest, ChatResponse,
    PDFDownloadRequest, PDFListResponse, PDFInfo, RAGQueryRequest, RAGQueryResponse,
    RAGChunk, ToolCall
)
from agent.agent import invoke_agent
from agent.state import AgentState
from core.auth import (
    create_access_token, get_current_user, get_owned_pdf, get_owned_session,
    hash_password, verify_password,
)
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


# =================== AUTH ROUTES ===================

@router.post("/auth/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """Register a new account with email and password."""
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing = await db.get_user_by_email(request.email)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_id = str(uuid.uuid4())
    password_hash = hash_password(request.password)

    try:
        await db.create_user(user_id, request.email, password_hash)
    except ValueError as e:
        raise HTTPException(status_code=409, detail="Could not create account") from e

    token = create_access_token(user_id, request.email)
    logger.info(f"Registered user {user_id}")
    return AuthResponse(
        access_token=token,
        user_id=user_id,
        email=request.email,
    )


@router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Log in with email and password."""
    user = await db.get_user_by_email(request.email)
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user["user_id"], user["email"])
    logger.info(f"User logged in: {user['user_id']}")
    return AuthResponse(
        access_token=token,
        user_id=user["user_id"],
        email=user["email"],
    )


@router.get("/users/me", response_model=UserProfileResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return UserProfileResponse(
        user_id=current_user["user_id"],
        email=current_user["email"],
        created_at=current_user.get("created_at", datetime.now().isoformat()),
    )


# =================== SESSION ROUTES ===================

@router.post("/sessions", response_model=SessionResponse)
async def create_session_frontend(
    request: CreateSessionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new research session for the authenticated user."""
    try:
        title = request.session_name
        user_id = current_user["user_id"]

        session_id = await db.create_session(
            user_id=user_id,
            session_name=title,
            topic=title[:50],
        )

        logger.info(f"Created session {session_id} for user {user_id}")

        session = await db.get_session(session_id)
        return SessionResponse(
            session_id=session_id,
            user_id=user_id,
            session_name=session.get("session_name", title) if session else title,
            created_at=session.get("created_at", datetime.now().isoformat()) if session else datetime.now().isoformat(),
            conversation_topic=session.get("conversation_topic") if session else None,
        )

    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/me/sessions")
async def list_sessions(current_user: dict = Depends(get_current_user)):
    """List all sessions for the authenticated user."""
    try:
        all_sessions = await db.list_sessions(current_user["user_id"])
        return [
            SessionResponse(
                session_id=s.get("session_id"),
                user_id=s.get("user_id"),
                session_name=s.get("session_name"),
                created_at=s.get("created_at"),
                conversation_topic=s.get("conversation_topic"),
            )
            for s in (all_sessions if all_sessions else [])
        ]

    except Exception as e:
        logger.error(f"Error listing sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get session details (owner only)."""
    try:
        session = await get_owned_session(session_id, current_user["user_id"])

        return SessionResponse(
            session_id=session.get("session_id"),
            user_id=session.get("user_id"),
            session_name=session.get("session_name"),
            created_at=session.get("created_at"),
            conversation_topic=session.get("conversation_topic"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get all messages in a session (owner only)."""
    try:
        await get_owned_session(session_id, current_user["user_id"])
        history = await db.get_conversation_history(session_id)

        messages = []
        for msg in history:
            if msg.get("user_message"):
                messages.append({
                    "role": "user",
                    "content": msg.get("user_message"),
                })
            if msg.get("agent_response"):
                messages.append({
                    "role": "assistant",
                    "content": msg.get("agent_response"),
                })

        return messages

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/chat", response_model=ChatResponse)
async def chat_session(
    session_id: str,
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Send a message in a session (owner only)."""
    try:
        message_text = request.message

        if not message_text:
            raise HTTPException(status_code=400, detail="Message is required")

        session_info = await get_owned_session(session_id, current_user["user_id"])

        history, papers = await asyncio.gather(
            db.get_conversation_history(session_id),
            db.get_papers(session_id),
        )

        messages = [HumanMessage(content=message_text)]
        user_id = session_info.get("user_id")

        state = AgentState(
            messages=messages,
            session_id=session_id,
            user_id=user_id,
            session_pdfs=papers,
            rag_context=[],
        )

        result = await invoke_agent(state, session_id)
        logger.info(f"get the result from the agent")
        last_message = result["messages"][-1]
        logger.info(f"get the last message from the agent")
        response_text = last_message.content if hasattr(last_message, "content") else last_message
        if isinstance(response_text, dict):
            response_text = json.dumps(response_text)
        elif isinstance(response_text, list):
            try:
                texts = []
                for item in response_text:
                    if isinstance(item, dict) and "text" in item:
                        texts.append(item["text"])
                    elif isinstance(item, str):
                        texts.append(item)
                    else:
                        texts.append(json.dumps(item))
                response_text = "\n".join(texts)
            except Exception: 
                response_text = json.dumps(response_text)
        elif not isinstance(response_text, str):
            response_text = str(response_text)
        logger.info(f"get the response text from the last message")

        tools_used = []
        tools_used_for_db = []
        # Extract tool calls from all messages in this run
        for msg in result.get("messages", []):
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tool_call in msg.tool_calls:
                    tool_name = tool_call.get("name") if isinstance(tool_call, dict) else getattr(tool_call, "name", "unknown")
                    tools_used.append(ToolCall(
                        tool_name=tool_name,
                        status="executed",
                    ))
                    tools_used_for_db.append({
                        "tool_name": tool_name,
                        "status": "executed",
                    })
        logger.info(f"tools used in this message {tools_used}")

        await db.save_message(
            session_id=session_id,
            user_message=request.display_message or message_text,
            agent_response=response_text,
            tools_used=None,
        )

        logger.info(f"Chat completed for session {session_id}")

        return ChatResponse(
            session_id=session_id,
            response=response_text,
            tools_used=tools_used if tools_used else None,
            timestamp=datetime.now().isoformat(),
        )
    except Exception as e:
        logger.exception(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a session (owner only)."""
    try:
        await get_owned_session(session_id, current_user["user_id"])
        await db.delete_session(session_id)

        logger.info(f"Session deleted: {session_id}")

        return {"status": "success", "message": f"Session {session_id} deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =================== LEGACY ROUTES (kept for compatibility) ===================

@router.post("/chat", response_model=ChatResponse)
async def chat_legacy(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Send a message and get agent response (legacy route)."""
    try:
        session_info = await get_owned_session(request.session_id, current_user["user_id"])

        history, papers = await asyncio.gather(
            db.get_conversation_history(request.session_id),
            db.get_papers(request.session_id),
        )

        messages = [HumanMessage(content=request.message)]
        user_id = session_info.get("user_id")

        state = AgentState(
            messages=messages,
            session_id=request.session_id,
            user_id=user_id,
            session_pdfs=papers,
            rag_context=[],
        )

        result = await invoke_agent(state, request.session_id)

        response_text = last_message.content if hasattr(last_message, "content") else last_message
        if isinstance(response_text, dict):
            response_text = json.dumps(response_text)
        elif isinstance(response_text, list):
            try:
                texts = []
                for item in response_text:
                    if isinstance(item, dict) and "text" in item:
                        texts.append(item["text"])
                    elif isinstance(item, str):
                        texts.append(item)
                    else:
                        texts.append(json.dumps(item))
                response_text = "\n".join(texts)
            except Exception:
                response_text = json.dumps(response_text)
        elif not isinstance(response_text, str):
            response_text = str(response_text)

        tools_used = []
        tools_used_for_db = []
        last_msg = result["messages"][-1]
        if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
            for tool_call in last_msg.tool_calls:
                tool_name = tool_call.get("name") if isinstance(tool_call, dict) else getattr(tool_call, "name", "unknown")
                tools_used.append(ToolCall(
                    tool_name=tool_name,
                    status="executed",
                ))
                tools_used_for_db.append({
                    "tool_name": tool_name,
                    "status": "executed",
                })

        await db.save_message(
            session_id=request.session_id,
            user_message=request.message,
            agent_response=response_text,
            tools_used=json.dumps(tools_used_for_db) if tools_used_for_db else None,
        )

        logger.info(f"Chat completed for session {request.session_id}")

        return ChatResponse(
            session_id=request.session_id,
            response=response_text,
            tools_used=tools_used,
            timestamp=datetime.now().isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/history/{session_id}")
async def get_chat_history(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get conversation history for a session (owner only)."""
    try:
        await get_owned_session(session_id, current_user["user_id"])
        history = await db.get_conversation_history(session_id)
        return {"session_id": session_id, "messages": history}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/papers/{session_id}")
async def get_session_papers(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get all papers in a session (owner only)."""
    try:
        await get_owned_session(session_id, current_user["user_id"])
        papers = await db.get_papers(session_id)

        papers_data = [
            {
                "paper_id": paper.get("paper_id"),
                "arxiv_id": paper.get("arxiv_id"),
                "title": paper.get("title"),
                "authors": paper.get("authors"),
                "summary": paper.get("summary"),
                "pdf_url": paper.get("pdf_url"),
                "published_date": paper.get("published_date"),
                "stored_at": paper.get("stored_at"),
            }
            for paper in papers
        ]

        return {
            "session_id": session_id,
            "count": len(papers_data),
            "papers": papers_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting papers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/paper/{session_id}/{arxiv_id}")
async def get_paper_details(
    session_id: str,
    arxiv_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get specific paper details (owner only)."""
    try:
        await get_owned_session(session_id, current_user["user_id"])
        papers = await db.get_papers(session_id)

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
                    "stored_at": paper.get("stored_at"),
                }

        raise HTTPException(status_code=404, detail="Paper not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting paper: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =================== PDF ROUTES ===================

@router.post("/pdf/download")
async def download_pdf(
    request: PDFDownloadRequest,
    current_user: dict = Depends(get_current_user),
):
    """Download and store PDF from arxiv (owner only)."""
    try:
        await get_owned_session(request.session_id, current_user["user_id"])
        
        # 1. Check if this PDF is already downloaded and indexed in the CURRENT session
        existing_session_pdf = await db.get_pdf(request.paper_id)
        if existing_session_pdf and existing_session_pdf.get("vector_embedded"):
            return {
                "status": "success",
                "message": f"PDF '{request.title}' is already indexed in this session",
                "pdf_id": request.paper_id,
                "chunks": 0,
            }

        # 2. Check if this paper (arxiv_id) is already indexed GLOBALLY in any session
        from core.vector_store import get_vector_store
        store = get_vector_store()
        
        existing_global_pdf = await db.get_pdf_by_arxiv_id(request.arxiv_id)
        if existing_global_pdf and existing_global_pdf.get("vector_store_id"):
            vector_store_id = existing_global_pdf["vector_store_id"]
            # Check if it actually exists in the vector store
            exists_in_vector_store = await asyncio.to_thread(store.exists, vector_store_id)
            if exists_in_vector_store:
                logger.info(f"Reusing existing vector embeddings for paper {request.arxiv_id} (vector_store_id: {vector_store_id})")
                await db.save_pdf(
                    paper_id=request.paper_id,
                    session_id=request.session_id,
                    pdf_id=request.paper_id,
                    file_path=f"data/pdfs/{request.paper_id}.pdf",
                    file_size=0,
                    vector_store_id=vector_store_id,
                )
                return {
                    "status": "success",
                    "message": f"PDF '{request.title}' embeddings reused and indexed",
                    "pdf_id": request.paper_id,
                    "chunks": 0,
                }

        # 3. If not already indexed, download and process
        logger.info(f"Starting PDF download for session {request.session_id} and paper {request.paper_id}")
        chunks, metadatas = await process_pdf(
            pdf_url=request.pdf_url,
            pdf_id=request.paper_id,
            title=request.title,
        )
        logger.info(f"PDF processed: {request.paper_id} with {len(chunks)} chunks")
        logger.info(f"Starting vector store indexing for {request.paper_id}")
        await asyncio.gather(
            add_to_vector_store(request.paper_id, chunks, metadatas),
            db.save_pdf(
                paper_id=request.paper_id,
                session_id=request.session_id,
                pdf_id=request.paper_id,
                file_path=f"data/pdfs/{request.paper_id}.pdf",
                file_size=0,
                vector_store_id=request.paper_id,
            ),
        )

        # Delete the downloaded PDF file immediately to save disk space
        await delete_pdf(request.paper_id)
        logger.info(f"PDF file deleted after processing: {request.paper_id}")

        return {
            "status": "success",
            "message": f"PDF '{request.title}' downloaded, indexed, and local file deleted",
            "pdf_id": request.paper_id,
            "chunks": len(chunks),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pdf/list/{session_id}", response_model=PDFListResponse)
async def list_pdfs(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """List all PDFs in a session (owner only)."""
    try:
        await get_owned_session(session_id, current_user["user_id"])
        pdfs = await db.get_pdfs(session_id)

        pdf_infos = [
            PDFInfo(
                pdf_id=pdf["pdf_id"],
                title=pdf["title"],
                arxiv_id=pdf["arxiv_id"],
                download_date=pdf["download_date"],
                file_size=pdf.get("file_size"),
            )
            for pdf in pdfs
        ]

        return PDFListResponse(
            session_id=session_id,
            pdfs=pdf_infos,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing PDFs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/pdf/{pdf_id}")
async def delete_pdf_route(
    pdf_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a PDF from session (owner only)."""
    try:
        await get_owned_pdf(pdf_id, current_user["user_id"])

        # Retrieve the PDF record to check its vector_store_id
        pdf_info = await db.get_pdf(pdf_id)
        if not pdf_info:
            raise HTTPException(status_code=404, detail="PDF not found")

        vector_store_id = pdf_info.get("vector_store_id")

        # Delete the database record first
        await db.delete_pdf(pdf_id)

        # Reference counting: only delete from vector store if no other session uses it
        if vector_store_id:
            ref_count = await db.count_pdf_references(vector_store_id)
            if ref_count == 0:
                logger.info(f"No more references to vector_store_id: {vector_store_id}. Deleting vector chunks.")
                from core.vector_store import get_vector_store
                store = get_vector_store()
                await asyncio.to_thread(store.delete_pdf, vector_store_id)
            else:
                logger.info(f"vector_store_id: {vector_store_id} still referenced by {ref_count} other sessions. Keeping vector chunks.")

        # Try to delete any local PDF file just in case it exists
        await delete_pdf(pdf_id)

        logger.info(f"PDF deleted: {pdf_id}")

        return {"status": "success", "message": "PDF deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pdf/view/{pdf_id}")
async def view_pdf(
    pdf_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve PDF file for viewing (owner only or streamed on the fly)."""
    try:
        await get_owned_pdf(pdf_id, current_user["user_id"])

        pdf_path = PDF_DIR / f"{pdf_id}.pdf"

        # 1. If local file exists, serve it
        if await asyncio.to_thread(os.path.exists, pdf_path):
            return FileResponse(
                path=pdf_path,
                media_type="application/pdf",
                filename=f"{pdf_id}.pdf",
                content_disposition_type="inline",
            )

        # 2. If local file doesn't exist, stream on the fly from the remote pdf_url
        pdf_url = await db.get_pdf_url(pdf_id)
        if not pdf_url:
            raise HTTPException(status_code=404, detail="PDF url not found in database")

        logger.info(f"Streaming PDF on the fly from: {pdf_url}")

        import httpx
        from fastapi.responses import StreamingResponse

        async def stream_pdf():
            async with httpx.AsyncClient(timeout=30) as client:
                async with client.stream("GET", pdf_url) as response:
                    if response.status_code != 200:
                        logger.error(f"Failed to fetch remote PDF: {response.status_code}")
                        raise HTTPException(status_code=502, detail="Failed to fetch remote PDF")
                    async for chunk in response.aiter_bytes():
                        yield chunk

        return StreamingResponse(
            stream_pdf(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={pdf_id}.pdf"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =================== RAG ROUTES ===================

@router.post("/pdf/query", response_model=RAGQueryResponse)
async def query_pdf(
    request: RAGQueryRequest,
    current_user: dict = Depends(get_current_user),
):
    """Query stored PDFs for relevant information (owner only)."""
    try:
        await get_owned_session(request.session_id, current_user["user_id"])

        if request.pdf_id:
            await get_owned_pdf(request.pdf_id, current_user["user_id"])

        results = await query_vector_store(
            query=request.query,
            pdf_id=request.pdf_id,
            top_k=5,
        )

        chunks = []
        for result in results:
            chunks.append(RAGChunk(
                content=result["content"],
                source=result["metadata"].get("title", "Unknown"),
                page=result["metadata"].get("page", "N/A"),
                relevance_score=f"{result['score']:.2f}",
            ))

        return RAGQueryResponse(
            status="success",
            chunks_found=len(chunks),
            chunks=chunks,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =================== HEALTH CHECK ===================

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Research Agent Backend is running"}
