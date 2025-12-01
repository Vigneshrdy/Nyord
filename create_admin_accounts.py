import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.database import SessionLocal
from backend.app.models import User
from backend.app.utils import hash_password

def create_admin_accounts():
    """Create admin accounts in the database"""
    db = SessionLocal()
    try:
        admin_accounts = [
            {
                'username': 'vignesh',
                'email': 'vignesh@nyordbank.com',
                'password': 'admin123',
                'role': 'admin',
                'full_name': 'Vignesh Admin'
            },
            {
                'username': 'admin',
                'email': 'admin@nyordbank.com',
                'password': 'admin123',
                'role': 'admin',
                'full_name': 'System Administrator'
            },
            {
                'username': 'omar',
                'email': 'omar@nyordbank.com',
                'password': 'admin123',
                'role': 'admin',
                'full_name': 'Omar Admin'
            }
        ]

        for admin_data in admin_accounts:
            # Check if admin already exists
            existing = db.query(User).filter(User.username == admin_data['username']).first()
            if existing:
                print(f"Admin '{admin_data['username']}' already exists, skipping...")
                continue

            # Hash the password
            hashed_password = hash_password(admin_data['password'])
            
            # Create admin user
            admin_user = User(
                username=admin_data['username'],
                email=admin_data['email'],
                hashed_password=hashed_password,
                role=admin_data['role'],
                full_name=admin_data['full_name']
            )
            
            db.add(admin_user)
            print(f"Created admin account: {admin_data['username']} ({admin_data['email']})")

        db.commit()
        print("\n✅ Admin accounts created successfully!")
        print("\nAdmin Login Credentials:")
        print("Username: vignesh | Password: admin123")
        print("Username: admin   | Password: admin123") 
        print("Username: omar    | Password: admin123")
        
    except Exception as e:
        print(f"❌ Error creating admin accounts: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_accounts()