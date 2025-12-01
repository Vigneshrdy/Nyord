#!/usr/bin/env python3

import sys
import os

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal
import app.models
import app.utils

def main():
    db = SessionLocal()
    try:
        # Get existing users that need password updates
        existing_users = db.query(app.models.User).filter(
            app.models.User.username.in_(['vignesh', 'omar'])
        ).all()
        
        for user in existing_users:
            print(f"Updating user: {user.username}")
            # Update password to use new SHA-256 hashing
            new_password = "password123"  # Default password
            user.hashed_password = app.utils.hash_password(new_password)
            # Ensure user is approved (if admin) or pending (if customer)
            if user.role == "admin":
                user.status = "approved"
            else:
                user.status = "approved"  # Approve existing users
                user.kyc_approved = True
            
            print(f"  - Username: {user.username}")
            print(f"  - New password: {new_password}")
            print(f"  - Role: {user.role}")
            print(f"  - Status: {user.status}")
            print()
        
        db.commit()
        print(f"Updated {len(existing_users)} existing users")
        print("All existing users now use password: password123")
        
    except Exception as e:
        print(f"Error updating users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()