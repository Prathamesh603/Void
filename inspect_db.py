import sys
from pathlib import Path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from config.database import get_db_connection

def inspect():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Get table info/constraints for papers
        cursor.execute("""
            SELECT conname, pg_get_constraintdef(c.oid) 
            FROM pg_constraint c 
            JOIN pg_namespace n ON n.oid = c.connamespace 
            WHERE conrelid = 'papers'::regclass;
        """)
        rows = cursor.fetchall()
        print("Constraints on 'papers' table:")
        for row in rows:
            print(dict(row))
            
        cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'papers';")
        cols = cursor.fetchall()
        print("\nColumns of 'papers' table:")
        for col in cols:
            print(dict(col))
    except Exception as e:
        print("Error:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    inspect()
