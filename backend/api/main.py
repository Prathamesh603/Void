"""
FastAPI application setup
"""
import asyncio
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from config.database import init_database
from api.routes import router
from utils.logger import logger

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    await asyncio.to_thread(init_database)
    logger.info("🚀 Research Agent API started")
    yield
    try:
        from agent.agent import close_pool
        await close_pool()
    except Exception as e:
        logger.error(f"Error closing LangGraph Postgres checkpointer pool: {e}")
    logger.info("🛑 Research Agent API stopped")

# Create FastAPI app with lifespan
app = FastAPI(
    title="Research Agent API",
    description="Multi-session research agent with RAG capabilities",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Research Agent Backend", "status": "running", "docs": "http://localhost:8000/docs"}

if __name__ == "__main__":
    import uvicorn
    from config.settings import API_HOST, API_PORT
    
    # Run without reload to avoid continuous restarts
    uvicorn.run(
        "api.main:app",
        host=API_HOST,
        port=API_PORT,
        reload=False  # Disable reload (app was getting stuck on reload)
    )
