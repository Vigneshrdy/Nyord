#!/usr/bin/env python3
"""
Simple Admin User Creator
Creates admin users with minimal inputs: username, email, password
All other fields are set to default values
Admin users have elevated privileges and can approve other accounts
"""

import asyncio
import sys
import os
from datetime import datetime
from getpass import getpass

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.database import SessionLocal
from app.models import User, Account
from app.utils import hash_password
from sqlalchemy.exc import IntegrityError


def create_admin_user():
    """Create a new admin user with minimal inputs"""
    
    print("=== Nyord Banking - Admin User Creator ===")
    print("⚠️  Warning: This creates an admin user with elevated privileges")
    print()
    
    # Get user inputs
    username = input("Enter admin username: ").strip()
    if not username:
        print("Error: Username is required")
        return False
        
    email = input("Enter admin email: ").strip()
    if not email:
        print("Error: Email is required")
        return False
        
    password = getpass("Enter admin password: ").strip()
    if not password:
        print("Error: Password is required")
        return False
        
    confirm_password = getpass("Confirm admin password: ").strip()
    if password != confirm_password:
        print("Error: Passwords do not match")
        return False
    
    # Confirm admin creation
    confirm = input("\nCreate admin user? (yes/no): ").strip().lower()
    if confirm not in ['yes', 'y']:
        print("Admin creation cancelled.")
        return False
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Hash password
        hashed_password = hash_password(password)
        
        # Create admin user with default values
        new_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role="admin",  # Admin role
            status="approved",  # Admins are auto-approved
            kyc_approved=True,  # Admins are auto-approved for KYC
            approval_date=datetime.utcnow(),
            full_name=username.title(),  # Use username as default full name
            phone=None,
            date_of_birth=None,
            address=None,
            government_id=None,
            id_type="passport",
            occupation="Bank Administrator",
            annual_income=None,
            employer_name="Nyord Bank",
            employment_type="employed",
            nationality=None,
            marital_status=None,
            emergency_contact_name=None,
            emergency_contact_phone=None,
            emergency_contact_relation=None
        )
        
        # Add user to database
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Generate account number (simple format)
        account_number = f"NY{new_user.id:08d}"
        
        # Create default admin account
        new_account = Account(
            account_number=account_number,
            account_type="current",  # Admins get current accounts
            balance=10000.0,  # Default admin balance
            user_id=new_user.id,
            status="approved",  # Admin accounts are auto-approved
            approved_by=new_user.id,  # Self-approved
            approval_date=datetime.utcnow()
        )
        
        # Add account to database
        db.add(new_account)
        db.commit()
        db.refresh(new_account)
        
        print("\n✅ Admin user created successfully!")
        print(f"User ID: {new_user.id}")
        print(f"Username: {new_user.username}")
        print(f"Email: {new_user.email}")
        print(f"Role: {new_user.role}")
        print(f"Status: {new_user.status}")
        print(f"KYC Approved: {new_user.kyc_approved}")
        print(f"Account Number: {new_account.account_number}")
        print(f"Account Type: {new_account.account_type}")
        print(f"Initial Balance: ${new_account.balance:.2f}")
        print("\n🔐 Admin Privileges:")
        print("- Can approve/reject customer accounts")
        print("- Can approve/reject KYC applications")
        print("- Can view all user information")
        print("- Can manage system settings")
        
        return True
        
    except IntegrityError as e:
        db.rollback()
        if "username" in str(e):
            print("Error: Username already exists")
        elif "email" in str(e):
            print("Error: Email already exists")
        else:
            print(f"Error: Database integrity error - {e}")
        return False
        
    except Exception as e:
        db.rollback()
        print(f"Error creating admin user: {e}")
        return False
        
    finally:
        db.close()


def main():
    """Main function"""
    try:
        success = create_admin_user()
        if success:
            print("\nAdmin user creation completed successfully!")
        else:
            print("\nAdmin user creation failed!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()