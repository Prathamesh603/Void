"""
Agent State definition - Core state management for LangGraph
"""
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from operator import add


class AgentState(TypedDict):
    """
    State definition for the research agent.
    
    Fields:
        messages: Conversation history with add_messages reducer
        session_pdfs: List of PDFs stored in session with add operator
    """
    
    # Core conversation
    messages: Annotated[list, add_messages]
    
    # Session context
    session_id: str
    user_id: str
    
    # PDFs in session (accumulate)
    session_pdfs: Annotated[list, add]
    
    # RAG context (for PDF chat)
    rag_context: list  # Retrieved chunks from vector store
