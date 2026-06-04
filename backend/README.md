# Backend Directory Structure

This is the FastAPI backend for the Research Agent application.

## Directory Structure

```
backend/
├── config/              # Configuration
│   ├── __init__.py
│   ├── settings.py      # Settings and environment variables
│   └── database.py      # Database initialization
├── agent/               # LangGraph Agent
│   ├── __init__.py
│   ├── state.py         # AgentState definition
│   ├── tools.py         # @tool definitions (arxiv, wiki, tavily, rag)
│   ├── nodes.py         # Graph nodes (chatbot, routing)
│   └── agent.py         # Agent compilation and invocation
├── core/                # Core functionality
│   ├── __init__.py
│   ├── vector_store.py  # RAG vector store (Chroma)
│   ├── pdf_handler.py   # PDF download, extraction, chunking
│   └── database_manager.py  # Database CRUD operations
├── api/                 # FastAPI Application
│   ├── __init__.py
│   ├── main.py          # FastAPI app setup
│   ├── routes.py        # API endpoints
│   └── models.py        # Pydantic request/response models
├── utils/               # Utilities
│   ├── __init__.py
│   └── logger.py        # Logging configuration
├── data/
│   ├── pdfs/            # Stored PDF files
│   └── embeddings/      # Vector store data (Chroma)
├── main.py              # Entry point
├── requirements.txt     # Python dependencies
├── .env.example         # Example environment variables
└── README.md            # This file
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Initialize Database (Supabase)

Add `DATABASE_URL` to `backend/.env` (see `.env.example`), then:

```bash
pip install psycopg2-binary
python -c "from config.database import init_database; init_database()"
```

Optional — copy existing local SQLite data once:

```bash
python -m config.database
```

### 4. Run Backend

```bash
python main.py
```

Server will start at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

## Architecture

### Agent Flow

```
User Message
    ↓
/api/chat (POST)
    ↓
Agent State (messages, session_pdfs, rag_context)
    ↓
LangGraph Graph
    ├─ chatbot_node (LLM decides tools)
    ├─ conditional_edge (has tool_calls?)
    ├─ ToolNode (executes: arxiv, wiki, tavily, rag)
    └─ loop back to chatbot
    ↓
Final Response + Tools Used
    ↓
Save to Database
    ↓
Return to Client
```

### Tools Available

1. **arxiv_tool** - Search academic papers
2. **wiki_tool** - Get information from Wikipedia
3. **tavily_tool** - Search latest news and web content
4. **rag_tool** - Retrieve from stored PDFs

### Database Schema

- `users` - User accounts
- `sessions` - Research sessions
- `conversations` - Message history
- `papers` - Paper metadata
- `pdf_files` - Downloaded PDFs
- `pdf_chunks` - Text chunks for RAG

### Vector Store

- **Type**: Chroma (embedded database)
- **Location**: `data/embeddings/chroma_db`
- **Embeddings**: sentence-transformers/all-MiniLM-L6-v2

## API Endpoints

### Sessions
- `POST /api/sessions/create` - Create new session
- `GET /api/sessions/{session_id}` - Get session details
- `GET /api/sessions/user/{user_id}` - List user sessions

### Chat
- `POST /api/chat` - Send message
- `GET /api/chat/history/{session_id}` - Get conversation history

### PDFs
- `POST /api/pdf/download` - Download and index PDF
- `GET /api/pdf/list/{session_id}` - List session PDFs
- `DELETE /api/pdf/{pdf_id}` - Delete PDF
- `POST /api/pdf/query` - Query PDFs with RAG

### Health
- `GET /api/health` - Health check

## Configuration

All settings are in `config/settings.py` and can be overridden with `.env`:

```
API_HOST=0.0.0.0
API_PORT=8000
LLM_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=your_key
TAVILY_API_KEY=your_key
```

## Next Steps

1. Create React frontend
2. Connect frontend to these API endpoints
3. Add user authentication
4. Deploy with Docker
