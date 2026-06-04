"""
Database initialization and management
"""
import sqlite3
from pathlib import Path
from config.settings import DATABASE_PATH

def init_database():
    """Initialize database with schema"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT,
            session_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            conversation_topic TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    """)
    
    # Conversations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            msg_id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            user_message TEXT,
            agent_response TEXT,
            tools_used TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES sessions(session_id)
        )
    """)
    
    # Papers table (from arxiv searches)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS papers (
            paper_id TEXT PRIMARY KEY,
            session_id TEXT,
            arxiv_id TEXT UNIQUE,
            title TEXT,
            summary TEXT,
            pdf_url TEXT,
            authors TEXT,
            published_date TEXT,
            stored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES sessions(session_id)
        )
    """)
    
    # PDF files table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pdf_files (
            pdf_id TEXT PRIMARY KEY,
            paper_id TEXT,
            session_id TEXT,
            file_path TEXT,
            file_size INTEGER,
            download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            vector_embedded BOOLEAN DEFAULT 0,
            vector_store_id TEXT,
            FOREIGN KEY(paper_id) REFERENCES papers(paper_id),
            FOREIGN KEY(session_id) REFERENCES sessions(session_id)
        )
    """)
    
    # PDF chunks table (for vector search)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pdf_chunks (
            chunk_id INTEGER PRIMARY KEY AUTOINCREMENT,
            pdf_id TEXT,
            chunk_text TEXT,
            chunk_index INTEGER,
            embedding BLOB,
            FOREIGN KEY(pdf_id) REFERENCES pdf_files(pdf_id)
        )
    """)
    
    conn.commit()
    conn.close()
    
    print(f"✓ Database initialized at {DATABASE_PATH}")

def get_db_connection():
    """Get database connection with proper SQLite configuration"""
    # Create connection with 30-second timeout
    conn = sqlite3.connect(DATABASE_PATH, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    
    # Enable WAL mode for better concurrent access
    conn.execute("PRAGMA journal_mode=WAL")
    
    # Set busy timeout to avoid "database is locked" errors
    conn.execute("PRAGMA busy_timeout=30000")  # 30 seconds in milliseconds
    
    # Optimize for better concurrency
    conn.execute("PRAGMA synchronous=NORMAL")  # Faster but still safe
    conn.execute("PRAGMA cache_size=10000")    # Larger cache
    conn.execute("PRAGMA temp_store=MEMORY")   # Use memory for temp tables
    
    return conn

if __name__ == "__main__":
    init_database()
