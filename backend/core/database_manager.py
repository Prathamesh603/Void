"""
Database manager for Research Agent
Handles all database operations
"""
from datetime import datetime
from typing import List, Dict, Optional
from config.database import get_db_connection


class DatabaseManager:
    """Manager for all database operations"""
    
    # =================== SESSIONS ===================
    @staticmethod
    def create_user(user_id: str, email: str):
        """Create a new User"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO users 
                (user_id, email)
                VALUES (?, ?)
            """, (user_id, email))
            
            conn.commit()
            return "success"
        except Exception as e:
            return str({"Exception":e,
                    "info":"User already exist"})
        finally:
            conn.close()
            
    @staticmethod
    def create_session(user_id: str, session_name: str, topic: str = None) -> str:
        """Create a new session"""
        import uuid
        session_id = str(uuid.uuid4())
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO sessions 
                (session_id, user_id, session_name, conversation_topic)
                VALUES (?, ?, ?, ?)
            """, (session_id, user_id, session_name, topic))
            
            conn.commit()
            return session_id
        finally:
            conn.close()
    
    @staticmethod
    def get_session(session_id: str) -> Optional[Dict]:
        """Get session details"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM sessions WHERE session_id = ?
            """, (session_id,))
            
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    @staticmethod
    def list_sessions(user_id: str) -> List[Dict]:
        """List all sessions for a user"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM sessions WHERE user_id = ?
                ORDER BY created_at DESC
            """, (user_id,))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()


    @staticmethod
    def list_users() ->List[Dict]:
        """List All users"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM users 
            """)
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
    
    @staticmethod
    def get_user(user_id: str):
        """Get single user by user_id"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM users
                WHERE user_id = ?
            """, (user_id,))

            row = cursor.fetchone()
            return dict(row) if row else None

        finally:
            conn.close()

    @staticmethod
    def delete_session(session_id: str):
        """Delete a session and all associated data"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Delete conversations
            cursor.execute("DELETE FROM conversations WHERE session_id = ?", (session_id,))
            
            # Delete PDFs
            cursor.execute("DELETE FROM pdf_files WHERE session_id = ?", (session_id,))
            
            # Delete papers
            cursor.execute("DELETE FROM papers WHERE session_id = ?", (session_id,))
            
            # Delete session
            cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
            
            conn.commit()
        finally:
            conn.close()
    
    # =================== CONVERSATIONS ===================
    
    @staticmethod
    def save_message(session_id: str, user_message: str, 
                    agent_response: str, tools_used: str = None):
        """Save a message exchange"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO conversations
                (session_id, user_message, agent_response, tools_used)
                VALUES (?, ?, ?, ?)
            """, (session_id, user_message, agent_response, tools_used))
            
            conn.commit()
        finally:
            conn.close()
    
    @staticmethod
    def get_conversation_history(session_id: str) -> List[Dict]:
        """Get all messages in a session"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM conversations WHERE session_id = ?
                ORDER BY timestamp ASC
            """, (session_id,))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
    
    # =================== PAPERS ===================
    
    @staticmethod
    def save_paper(session_id: str, arxiv_id: str, title: str, 
                  summary: str, pdf_url: str, authors: str = None,
                  published_date: str = None) -> str:
        """Save paper metadata from arxiv search"""
        import uuid
        paper_id = str(uuid.uuid4())
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO papers
                (paper_id, session_id, arxiv_id, title, summary, pdf_url, authors, published_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (paper_id, session_id, arxiv_id, title, summary, pdf_url, authors, published_date))
            
            conn.commit()
            return paper_id
        finally:
            conn.close()
    
    @staticmethod
    def get_papers(session_id: str) -> List[Dict]:
        """Get all papers in a session"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM papers WHERE session_id = ?
                ORDER BY stored_at DESC
            """, (session_id,))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
    
    # =================== PDF FILES ===================
    
    @staticmethod
    def save_pdf(paper_id: str, session_id: str, pdf_id: str, 
                 file_path: str, file_size: int, vector_store_id: str = None):
        """Save PDF file metadata"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO pdf_files
                (pdf_id, paper_id, session_id, file_path, file_size, vector_embedded, vector_store_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (pdf_id, paper_id, session_id, file_path, file_size, True, vector_store_id))
            
            conn.commit()
        finally:
            conn.close()
    
    @staticmethod
    def get_pdfs(session_id: str) -> List[Dict]:
        """Get all PDFs in a session"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT pf.*, p.title, p.arxiv_id FROM pdf_files pf
                LEFT JOIN papers p ON pf.paper_id = p.paper_id
                WHERE pf.session_id = ?
                ORDER BY pf.download_date DESC
            """, (session_id,))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
    
    @staticmethod
    def delete_pdf(pdf_id: str):
        """Delete PDF from database"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM pdf_files WHERE pdf_id = ?", (pdf_id,))
            
            conn.commit()
        finally:
            conn.close()


# Convenience instance
db = DatabaseManager()
