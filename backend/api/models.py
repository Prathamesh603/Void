"""
Pydantic models for API requests/responses
"""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, field_validator


def _datetime_to_str(value):
    """PostgreSQL returns datetime objects; API responses use ISO strings."""
    if value is None:
        return value
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)


# =================== AUTH MODELS ===================
class RegisterRequest(BaseModel):
    """Request to register a new account"""
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    """Request to log in"""
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Authentication response with JWT token"""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


class UserProfileResponse(BaseModel):
    """Current user profile"""
    user_id: str
    email: str
    created_at: str

    @field_validator("created_at", mode="before")
    @classmethod
    def _coerce_created_at(cls, value):
        return _datetime_to_str(value)


# =================== SESSION MODELS ===================
class CreateSessionRequest(BaseModel):
    """Request to create a new session"""
    session_name: str
    topic: Optional[str] = None


class SessionResponse(BaseModel):
    """Session information response"""
    session_id: str
    user_id: str
    session_name: str
    created_at: str
    conversation_topic: Optional[str] = None

    @field_validator("created_at", mode="before")
    @classmethod
    def _coerce_created_at(cls, value):
        return _datetime_to_str(value)


# =================== CHAT MODELS ===================

class ChatRequest(BaseModel):
    """Chat message request"""
    session_id: str
    message: str
    display_message: Optional[str] = None  # Clean user-facing message (saved to DB instead of enriched prompt)


class ToolCall(BaseModel):
    """Tool call information"""
    tool_name: str
    status: str


class ChatResponse(BaseModel):
    """Chat response"""
    session_id: str
    response: str
    tools_used: Optional[List[ToolCall]] = None
    timestamp: str


# =================== PDF MODELS ===================

class PaperInfo(BaseModel):
    """Paper information from arxiv"""
    arxiv_id: str
    title: str
    summary: str
    pdf_url: str
    authors: Optional[str] = None
    published_date: Optional[str] = None


class PDFDownloadRequest(BaseModel):
    """Request to download and store PDF"""
    session_id: str
    paper_id: str
    arxiv_id: str
    pdf_url: str
    title: str


class PDFInfo(BaseModel):
    """PDF information in session"""
    pdf_id: str
    title: str
    arxiv_id: str
    download_date: str
    file_size: Optional[int] = None

    @field_validator("download_date", mode="before")
    @classmethod
    def _coerce_download_date(cls, value):
        return _datetime_to_str(value)


class PDFListResponse(BaseModel):
    """List of PDFs in session"""
    session_id: str
    pdfs: List[PDFInfo]


# =================== RAG MODELS ===================

class RAGChunk(BaseModel):
    """Retrieved chunk from RAG"""
    content: str
    source: str
    page: str
    relevance_score: str


class RAGQueryRequest(BaseModel):
    """RAG query request"""
    session_id: str
    query: str
    pdf_id: Optional[str] = None


class RAGQueryResponse(BaseModel):
    """RAG query response"""
    status: str
    chunks_found: int
    chunks: List[RAGChunk]


# =================== ERROR MODELS ===================

class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    message: str
    status_code: int
