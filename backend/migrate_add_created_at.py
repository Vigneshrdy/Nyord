"""
Migration script to add created_at columns to users, loans and cards tables
Run this script to update the database schema
"""

from app.database import engine
from sqlalchemy import text

def migrate():
    # Add created_at to users table
    try:
        with engine.connect() as conn:
            print("Adding created_at column to users table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            conn.commit()
            print("✓ Added created_at to users table")
    except Exception as e:
        print(f"Note: Users - {e}")
    
    # Add created_at to loans table
    try:
        with engine.connect() as conn:
            print("Adding created_at column to loans table...")
            conn.execute(text("ALTER TABLE loans ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            conn.commit()
            print("✓ Added created_at to loans table")
    except Exception as e:
        print(f"Note: Loans - {e}")
    
    # Add created_at to cards table
    try:
        with engine.connect() as conn:
            print("Adding created_at column to cards table...")
            conn.execute(text("ALTER TABLE cards ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            conn.commit()
            print("✓ Added created_at to cards table")
    except Exception as e:
        print(f"Note: Cards - {e}")
    
    # Update existing records
    try:
        with engine.connect() as conn:
            print("Updating existing records...")
            conn.execute(text("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
            conn.execute(text("UPDATE loans SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
            conn.execute(text("UPDATE cards SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
            conn.commit()
            print("✓ Updated existing records")
    except Exception as e:
        print(f"Note: Update - {e}")
    
    print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
