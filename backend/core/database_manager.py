"""
Database manager for Research Agent
Handles all database operations
"""
import asyncio
from datetime import datetime
from typing import List, Dict, Optional
from config.database import get_db_connection


class DatabaseManager:
    """Manager for all database operations"""

    # =================== USERS ===================
    @staticmethod
    def _create_user(user_id: str, email: str, password_hash: str):
        """Create a new user with hashed password."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO users 
                (user_id, email, password_hash)
                VALUES (?, ?, ?)
            """, (user_id, email, password_hash))

            conn.commit()
            return "success"
        except Exception as e:
            raise ValueError(str(e))
        finally:
            conn.close()

    @staticmethod
    async def create_user(user_id: str, email: str, password_hash: str):
        return await asyncio.to_thread(
            DatabaseManager._create_user, user_id, email, password_hash
        )

    @staticmethod
    def _get_user_by_email(email: str):
        """Get user by email address."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM users
                WHERE LOWER(email) = LOWER(?)
            """, (email,))

            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    @staticmethod
    async def get_user_by_email(email: str):
        return await asyncio.to_thread(DatabaseManager._get_user_by_email, email)

    @staticmethod
    def _create_session(user_id: str, session_name: str, topic: str = None) -> str:
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
    async def create_session(user_id: str, session_name: str, topic: str = None) -> str:
        return await asyncio.to_thread(
            DatabaseManager._create_session, user_id, session_name, topic
        )

    @staticmethod
    def _get_session(session_id: str) -> Optional[Dict]:
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
    async def get_session(session_id: str) -> Optional[Dict]:
        return await asyncio.to_thread(DatabaseManager._get_session, session_id)

    @staticmethod
    def _list_sessions(user_id: str) -> List[Dict]:
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
    async def list_sessions(user_id: str) -> List[Dict]:
        return await asyncio.to_thread(DatabaseManager._list_sessions, user_id)

    @staticmethod
    def _get_user(user_id: str):
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
    async def get_user(user_id: str):
        return await asyncio.to_thread(DatabaseManager._get_user, user_id)

    @staticmethod
    def _delete_session(session_id: str):
        """Delete a session and all associated data"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            cursor.execute("DELETE FROM conversations WHERE session_id = ?", (session_id,))
            cursor.execute("DELETE FROM pdf_files WHERE session_id = ?", (session_id,))
            cursor.execute("DELETE FROM papers WHERE session_id = ?", (session_id,))
            cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))

            conn.commit()
        finally:
            conn.close()

    @staticmethod
    async def delete_session(session_id: str):
        return await asyncio.to_thread(DatabaseManager._delete_session, session_id)

    # =================== CONVERSATIONS ===================

    @staticmethod
    def _save_message(session_id: str, user_message: str,
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
    async def save_message(session_id: str, user_message: str,
                           agent_response: str, tools_used: str = None):
        return await asyncio.to_thread(
            DatabaseManager._save_message,
            session_id, user_message, agent_response, tools_used
        )

    @staticmethod
    def _get_conversation_history(session_id: str) -> List[Dict]:
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

    @staticmethod
    async def get_conversation_history(session_id: str) -> List[Dict]:
        return await asyncio.to_thread(
            DatabaseManager._get_conversation_history, session_id
        )

    # =================== PAPERS ===================

    @staticmethod
    def _save_paper(session_id: str, arxiv_id: str, title: str,
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
    async def save_paper(session_id: str, arxiv_id: str, title: str,
                         summary: str, pdf_url: str, authors: str = None,
                         published_date: str = None) -> str:
        return await asyncio.to_thread(
            DatabaseManager._save_paper,
            session_id, arxiv_id, title, summary, pdf_url, authors, published_date
        )

    @staticmethod
    def _get_papers(session_id: str) -> List[Dict]:
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

    @staticmethod
    async def get_papers(session_id: str) -> List[Dict]:
        return await asyncio.to_thread(DatabaseManager._get_papers, session_id)

    # =================== PDF FILES ===================

    @staticmethod
    def _save_pdf(paper_id: str, session_id: str, pdf_id: str,
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
    async def save_pdf(paper_id: str, session_id: str, pdf_id: str,
                       file_path: str, file_size: int, vector_store_id: str = None):
        return await asyncio.to_thread(
            DatabaseManager._save_pdf,
            paper_id, session_id, pdf_id, file_path, file_size, vector_store_id
        )

    @staticmethod
    def _get_pdfs(session_id: str) -> List[Dict]:
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
    async def get_pdfs(session_id: str) -> List[Dict]:
        return await asyncio.to_thread(DatabaseManager._get_pdfs, session_id)

    @staticmethod
    def _get_pdf(pdf_id: str) -> Optional[Dict]:
        """Get PDF metadata by id."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM pdf_files WHERE pdf_id = ?
            """, (pdf_id,))

            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    @staticmethod
    async def get_pdf(pdf_id: str) -> Optional[Dict]:
        return await asyncio.to_thread(DatabaseManager._get_pdf, pdf_id)

    @staticmethod
    def _delete_pdf(pdf_id: str):
        """Delete PDF from database"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            cursor.execute("DELETE FROM pdf_files WHERE pdf_id = ?", (pdf_id,))

            conn.commit()
        finally:
            conn.close()

    @staticmethod
    async def delete_pdf(pdf_id: str):
        return await asyncio.to_thread(DatabaseManager._delete_pdf, pdf_id)

    @staticmethod
    def _get_paper_by_arxiv_id(arxiv_id: str) -> Optional[Dict]:
        """Get paper details by arxiv_id"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM papers WHERE arxiv_id = ?
            """, (arxiv_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    @staticmethod
    async def get_paper_by_arxiv_id(arxiv_id: str) -> Optional[Dict]:
        return await asyncio.to_thread(DatabaseManager._get_paper_by_arxiv_id, arxiv_id)

    @staticmethod
    def _get_pdf_by_arxiv_id(arxiv_id: str) -> Optional[Dict]:
        """Get PDF metadata by arxiv_id (globally)"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT pf.* FROM pdf_files pf
                JOIN papers p ON pf.paper_id = p.paper_id
                WHERE p.arxiv_id = ?
                LIMIT 1
            """, (arxiv_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    @staticmethod
    async def get_pdf_by_arxiv_id(arxiv_id: str) -> Optional[Dict]:
        return await asyncio.to_thread(DatabaseManager._get_pdf_by_arxiv_id, arxiv_id)

    @staticmethod
    def _get_pdf_url(pdf_id: str) -> Optional[str]:
        """Get paper's pdf_url by pdf_id"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.pdf_url FROM pdf_files pf
                JOIN papers p ON pf.paper_id = p.paper_id
                WHERE pf.pdf_id = ?
            """, (pdf_id,))
            row = cursor.fetchone()
            return row["pdf_url"] if row else None
        finally:
            conn.close()

    @staticmethod
    async def get_pdf_url(pdf_id: str) -> Optional[str]:
        return await asyncio.to_thread(DatabaseManager._get_pdf_url, pdf_id)

    @staticmethod
    def _count_pdf_references(vector_store_id: str) -> int:
        """Count how many PDF records use a given vector_store_id"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) as count FROM pdf_files WHERE vector_store_id = ?
            """, (vector_store_id,))
            row = cursor.fetchone()
            return row["count"] if row else 0
        finally:
            conn.close()

    @staticmethod
    async def count_pdf_references(vector_store_id: str) -> int:
        return await asyncio.to_thread(DatabaseManager._count_pdf_references, vector_store_id)


# Convenience instance
db = DatabaseManager()
