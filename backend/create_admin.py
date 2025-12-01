#!/usr/bin/env python3

import sys
import os

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal
from app.auth import create_admin_user
import app.models

def main():
    db = SessionLocal()
    try:
        # Delete existing admin user first
        existing_admin = db.query(app.models.User).filter(app.models.User.username == "admin").first()
        if existing_admin:
            db.delete(existing_admin)
            db.commit()
            print("Deleted existing admin user")
        
        # Create admin user
        admin_user = create_admin_user(
            username="admin",
            email="admin@nyord.com", 
            password="admin123",
            db=db
        )
        print(f"Admin user created successfully!")
        print(f"Username: admin")
        print(f"Email: admin@nyord.com")
        print(f"Password: admin123")
        print(f"User ID: {admin_user.id}")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()