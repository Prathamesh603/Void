"""
Configuration settings for Research Agent Backend
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Project root
PROJECT_ROOT = Path(__file__).parent.parent.parent

# Directories
BACKEND_DIR = PROJECT_ROOT / "backend"
DATA_DIR = BACKEND_DIR / "data"

# Load environment variables from .env file
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(PROJECT_ROOT / ".env")

PDF_DIR = DATA_DIR / "pdfs"
EMBEDDINGS_DIR = DATA_DIR / "embeddings"

# Create directories if they don't exist
PDF_DIR.mkdir(parents=True, exist_ok=True)
EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)

# Database (Supabase PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_PATH = DATA_DIR / "research_agent.db"  # used only for optional SQLite migration

# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))
API_RELOAD = os.getenv("API_RELOAD", "True").lower() == "true"

# LLM Configuration
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", 0))
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")  # groq, openai, etc

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Embeddings
EMBEDDINGS_MODEL = os.getenv("EMBEDDINGS_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
EMBEDDINGS_PROVIDER = os.getenv("EMBEDDINGS_PROVIDER", "huggingface")  # huggingface, openai

# Vector Store
VECTOR_STORE_TYPE = os.getenv("VECTOR_STORE_TYPE", "chroma")  # chroma, pinecone, weaviate
VECTOR_STORE_PATH = EMBEDDINGS_DIR / "chroma_db"

# PDF Processing
PDF_CHUNK_SIZE = int(os.getenv("PDF_CHUNK_SIZE", 500))
PDF_CHUNK_OVERLAP = int(os.getenv("PDF_CHUNK_OVERLAP", 50))

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Debug mode
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
