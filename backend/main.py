"""
Entry point for Research Agent Backend
"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from api.main import app

if __name__ == "__main__":
    import uvicorn
    from config.settings import API_HOST, API_PORT, API_RELOAD
    
    print("🚀 Starting Research Agent Backend...")
    print(f"📍 Server: http://{API_HOST}:{API_PORT}")
    print(f"📚 Docs: http://{API_HOST}:{API_PORT}/docs")
    
    loop_setting = "utils.loop_selector:win_selector_loop_factory" if sys.platform == "win32" else "auto"
    
    uvicorn.run(
        "api.main:app",
        host=API_HOST,
        port=API_PORT,
        reload=API_RELOAD,
        loop=loop_setting
    )
