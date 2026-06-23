import sys
from pathlib import Path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from config.database import get_db_connection, init_database

def reset_and_initialize():
    print("⚠️  Warning: This will drop all tables and delete all data from the database.")
    confirm = input("Are you sure you want to proceed? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("Aborted.")
        return

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        print("Dropping existing tables...")
        # Order matters due to foreign key constraints (or use CASCADE in PostgreSQL)
        cursor.execute("DROP TABLE IF EXISTS pdf_chunks CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS pdf_files CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS papers CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS conversations CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS sessions CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS users CASCADE;")
        conn.commit()
        print("✓ Tables dropped successfully.")
    except Exception as e:
        print("Error dropping tables:", e)
        conn.rollback()
        return
    finally:
        conn.close()

    print("Reinitializing database schema...")
    try:
        init_database()
        print("✓ Database reinitialized successfully.")
    except Exception as e:
        print("Error reinitializing database:", e)

if __name__ == "__main__":
    reset_and_initialize()
