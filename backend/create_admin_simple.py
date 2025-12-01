import sys
import os
import hashlib
import secrets

# Add the current directory to the path
sys.path.append(os.getcwd())

from app.database import SessionLocal, engine
from app.models import User, Base

# Create all tables
Base.metadata.create_all(bind=engine)

def hash_password(password: str):
    # Use SHA-256 with salt as a temporary workaround for bcrypt issues
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{password_hash}"

def main():
    db = SessionLocal()
    try:
        # Delete existing admin user first
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            db.delete(existing_admin)
            db.commit()
            print("Deleted existing admin user")
        
        # Create new admin user
        hashed_pw = hash_password("admin123")
        
        admin_user = User(
            username="admin",
            email="admin@nyord.com",
            hashed_password=hashed_pw,
            role="admin",
            status="approved",  # Admin is pre-approved
            kyc_approved=True,
            full_name="System Administrator"
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"Admin user created successfully!")
        print(f"Username: admin")
        print(f"Email: admin@nyord.com")
        print(f"Password: admin123")
        print(f"User ID: {admin_user.id}")
        print(f"Role: {admin_user.role}")
        print(f"Status: {admin_user.status}")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()