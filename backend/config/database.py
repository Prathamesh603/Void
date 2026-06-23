"""
Database initialization and management (PostgreSQL / Supabase)
"""
import sqlite3
from typing import Any, Optional, Sequence

import psycopg2
from psycopg2.extras import RealDictCursor

from config.settings import DATABASE_PATH, DATABASE_URL


def _connect():
    """Connect to Supabase Postgres (SSL required)."""
    url = DATABASE_URL
    if url and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"
    return psycopg2.connect(url)


SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT,
        session_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        conversation_topic TEXT,
        FOREIGN KEY(user_id) REFERENCES users(user_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS conversations (
        msg_id SERIAL PRIMARY KEY,
        session_id TEXT,
        user_message TEXT,
        agent_response TEXT,
        tools_used TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES sessions(session_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS papers (
        paper_id TEXT PRIMARY KEY,
        session_id TEXT,
        arxiv_id TEXT,
        title TEXT,
        summary TEXT,
        pdf_url TEXT,
        authors TEXT,
        published_date TEXT,
        stored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES sessions(session_id),
        UNIQUE (session_id, arxiv_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS pdf_files (
        pdf_id TEXT PRIMARY KEY,
        paper_id TEXT,
        session_id TEXT,
        file_path TEXT,
        file_size INTEGER,
        download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        vector_embedded BOOLEAN DEFAULT FALSE,
        vector_store_id TEXT,
        FOREIGN KEY(paper_id) REFERENCES papers(paper_id),
        FOREIGN KEY(session_id) REFERENCES sessions(session_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS pdf_chunks (
        chunk_id SERIAL PRIMARY KEY,
        pdf_id TEXT,
        chunk_text TEXT,
        chunk_index INTEGER,
        embedding BYTEA,
        FOREIGN KEY(pdf_id) REFERENCES pdf_files(pdf_id)
    )
    """,
]


class _CompatCursor:
    """Translate SQLite-style ? placeholders to PostgreSQL %s."""

    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query: str, params: Optional[Sequence[Any]] = None):
        if "?" in query:
            query = query.replace("?", "%s")
        self._cursor.execute(query, params)

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()


class _CompatConnection:
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return _CompatCursor(
            self._conn.cursor(cursor_factory=RealDictCursor)
        )

    def commit(self):
        self._conn.commit()

    def close(self):
        self._conn.close()


def init_database():
    """Initialize PostgreSQL schema on Supabase."""
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Add your Supabase connection string to backend/.env"
        )

    conn = _connect()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Remove unique constraint on arxiv_id to allow multiple sessions to store the same paper
        try:
            # Query pg_constraint for any unique constraint on papers table
            cursor.execute("""
                SELECT conname 
                FROM pg_constraint 
                WHERE conrelid = 'papers'::regclass AND contype = 'u'
            """)
            constraints = [row["conname"] for row in cursor.fetchall()]
            for con in constraints:
                if con != "papers_session_id_arxiv_id_key":
                    print(f"Dropping constraint {con} from papers table")
                    cursor.execute(f"ALTER TABLE papers DROP CONSTRAINT IF EXISTS {con} CASCADE")
            conn.commit()
        except Exception as e:
            print(f"Note: Could not drop unique constraints: {e}")
            conn.rollback()

        # Drop any unique index on arxiv_id (except the composite one)
        try:
            cursor.execute("""
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'papers' AND indexdef LIKE '%UNIQUE%' AND indexdef LIKE '%arxiv_id%'
            """)
            indexes = [row["indexname"] for row in cursor.fetchall()]
            for idx in indexes:
                if idx != "papers_session_id_arxiv_id_key":
                    print(f"Dropping unique index {idx} from papers table")
                    cursor.execute(f"DROP INDEX IF EXISTS {idx} CASCADE")
            conn.commit()
        except Exception as e:
            print(f"Note: Could not drop unique indexes: {e}")
            conn.rollback()

        # Add composite unique constraint (session_id, arxiv_id) to papers table
        try:
            cursor.execute("ALTER TABLE papers ADD CONSTRAINT papers_session_id_arxiv_id_key UNIQUE (session_id, arxiv_id)")
            conn.commit()
        except Exception as e:
            # If it already exists, it will raise an error, which we safely ignore
            conn.rollback()

        for statement in SCHEMA_STATEMENTS:
            cursor.execute(statement)
        cursor.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT"
        )
        conn.commit()
        print("✓ Database initialized on Supabase (PostgreSQL)")
    finally:
        conn.close()


def get_db_connection():
    """Get a PostgreSQL connection (SQLite-compatible cursor API)."""
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Add your Supabase connection string to backend/.env"
        )

    return _CompatConnection(_connect())


def migrate_sqlite_to_postgres():
    """One-time copy of existing local SQLite data into Supabase."""
    if not DATABASE_PATH.exists():
        print("No local SQLite file found; skipping migration.")
        return

    sqlite_conn = sqlite3.connect(DATABASE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    pg_conn = get_db_connection()

    tables = [
        ("users", "user_id, email, created_at"),
        (
            "sessions",
            "session_id, user_id, session_name, created_at, updated_at, conversation_topic",
        ),
        (
            "conversations",
            "session_id, user_message, agent_response, tools_used, timestamp",
        ),
        (
            "papers",
            "paper_id, session_id, arxiv_id, title, summary, pdf_url, authors, published_date, stored_at",
        ),
        (
            "pdf_files",
            "pdf_id, paper_id, session_id, file_path, file_size, download_date, vector_embedded, vector_store_id",
        ),
        (
            "pdf_chunks",
            "pdf_id, chunk_text, chunk_index, embedding",
        ),
    ]

    try:
        sc = sqlite_conn.cursor()
        pc = pg_conn.cursor()

        for table, columns in tables:
            sc.execute(f"SELECT {columns} FROM {table}")
            rows = sc.fetchall()
            if not rows:
                continue

            placeholders = ", ".join(["?"] * len(rows[0]))
            col_list = columns
            insert_sql = f"INSERT INTO {table} ({col_list}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"

            for row in rows:
                values = tuple(row)
                if table == "pdf_files" and values[6] is not None:
                    values = (
                        values[0],
                        values[1],
                        values[2],
                        values[3],
                        values[4],
                        values[5],
                        bool(values[6]),
                        values[7],
                    )
                try:
                    pc.execute(insert_sql, values)
                except Exception as exc:
                    print(f"Skip row in {table}: {exc}")

            pg_conn.commit()
            print(f"Migrated {len(rows)} row(s) into {table}")

        print("✓ SQLite migration finished")
    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    init_database()
    migrate_sqlite_to_postgres()
