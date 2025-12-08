"""
Migration script to add account_id column to fixed_deposits table.
Run this once to update the database schema.
"""
from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.connect() as conn:
        # Check if column exists (PostgreSQL syntax)
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name='fixed_deposits' 
            AND column_name='account_id'
        """))
        
        if result.scalar() == 0:
            print("Adding account_id column to fixed_deposits table...")
            conn.execute(text("""
                ALTER TABLE fixed_deposits 
                ADD COLUMN account_id INTEGER 
                REFERENCES accounts(id)
            """))
            conn.commit()
            print("✓ Column added successfully!")
        else:
            print("✓ Column already exists, skipping migration.")

if __name__ == "__main__":
    migrate()
