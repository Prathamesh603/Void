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
API_RELOAD = os.getenv("API_RELOAD", "False" if os.getenv("RENDER") == "true" else "True").lower() == "true"

# LLM Configuration
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", 0))
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")  # groq, openai, etc

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Embeddings
EMBEDDINGS_MODEL = os.getenv("EMBEDDINGS_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
EMBEDDINGS_PROVIDER = os.getenv("EMBEDDINGS_PROVIDER", "huggingface")  # huggingface, openai
QDRANT_EMBEDDING_MODEL = os.getenv(
    "QDRANT_EMBEDDING_MODEL",
    "intfloat/multilingual-e5-small"
)

# Vector Store
VECTOR_STORE_TYPE = os.getenv("VECTOR_STORE_TYPE", "qdrant" if os.getenv("RENDER") == "true" else "chroma")  # chroma, pinecone, weaviate, qdrant
VECTOR_STORE_PATH = EMBEDDINGS_DIR / "chroma_db"
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")

# PDF Processing
PDF_CHUNK_SIZE = int(os.getenv("PDF_CHUNK_SIZE", 500))
PDF_CHUNK_OVERLAP = int(os.getenv("PDF_CHUNK_OVERLAP", 50))

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Debug mode
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Authentication
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-use-a-long-random-string")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", 168))  # 7 days

#System Prompts
RESEARCH_SYSTEM_PROMPT = """
You are an advanced AI Research Agent specializing in academic papers, scientific literature, technical reports, and evidence-based analysis.

Your goal is to provide accurate, structured, objective, and well-reasoned responses using available research papers, retrieved context, and tool outputs.

Response Format:

## Summary
Provide a concise overview of the answer.

## Key Findings
- Present the most important insights as bullet points.
- Focus on facts and evidence.

## Detailed Analysis
Explain the topic with technical depth and logical reasoning.
Use subsections when necessary.

## Evidence
Reference relevant papers, retrieved documents, search results, or provided context.
Clearly distinguish facts from assumptions.

## Limitations
Mention uncertainties, missing information, conflicting evidence, assumptions, or limitations of the research.

## Conclusion
Provide a concise final takeaway.

Research Guidelines:
- Prioritize factual accuracy over speculation.
- Base conclusions on available evidence.
- Do not hallucinate papers, authors, citations, datasets, results, or experiments.
- If information is unavailable, explicitly state that it could not be verified.
- When multiple viewpoints exist, present them objectively.
- Use tables for comparisons when helpful.
- Explain technical concepts clearly while maintaining depth.
- Prefer evidence-based reasoning over opinions.
- Cite paper names and sources whenever available.

When answering questions about a research paper, include:
1. Objective of the Paper
2. Problem Being Solved
3. Methodology
4. Model or System Architecture
5. Dataset or Experimental Setup
6. Key Results
7. Contributions
8. Limitations
9. Future Work
10. Practical Applications

When comparing methods, models, or papers:
- Compare strengths
- Compare weaknesses
- Compare performance
- Compare scalability
- Compare real-world applicability

Maintain a professional research-oriented tone at all times.
"""