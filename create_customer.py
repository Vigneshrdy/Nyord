#!/usr/bin/env python3
"""
Simple Customer Account Creator
Creates customer accounts with minimal inputs: username, email, password
All other fields are set to default values
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


def create_customer_account():
    """Create a new customer account with minimal inputs"""
    
    print("=== Nyord Banking - Customer Account Creator ===")
    print()
    
    # Get user inputs
    username = input("Enter username: ").strip()
    if not username:
        print("Error: Username is required")
        return False
        
    email = input("Enter email: ").strip()
    if not email:
        print("Error: Email is required")
        return False
        
    password = getpass("Enter password: ").strip()
    if not password:
        print("Error: Password is required")
        return False
        
    confirm_password = getpass("Confirm password: ").strip()
    if password != confirm_password:
        print("Error: Passwords do not match")
        return False
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Hash password
        hashed_password = hash_password(password)
        
        # Create user with default values
        new_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role="customer",
            status="approved",  # Needs admin approval
            kyc_approved=True,
            full_name=username.title(),  # Use username as default full name
            phone=None,
            date_of_birth=None,
            address=None,
            government_id=None,
            id_type="passport",
            occupation=None,
            annual_income=None,
            employer_name=None,
            employment_type=None,
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
        
        # Create default savings account
        new_account = Account(
            account_number=account_number,
            account_type="savings",
            balance=0.0,
            user_id=new_user.id,
            status="pending"  # Needs admin approval
        )
        
        # Add account to database
        db.add(new_account)
        db.commit()
        db.refresh(new_account)
        
        print("\n✅ Customer account created successfully!")
        print(f"User ID: {new_user.id}")
        print(f"Username: {new_user.username}")
        print(f"Email: {new_user.email}")
        print(f"Role: {new_user.role}")
        print(f"Status: {new_user.status} (pending admin approval)")
        print(f"Account Number: {new_account.account_number}")
        print(f"Account Type: {new_account.account_type}")
        print(f"Initial Balance: ${new_account.balance:.2f}")
        # print("\nNote: Account is pending approval by an admin.")
        print("Accccount crated successfully .")
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
        print(f"Error creating customer account: {e}")
        return False
        
    finally:
        db.close()


def main():
    """Main function"""
    try:
        success = create_customer_account()
        if success:
            print("\nCustomer account creation completed successfully!")
        else:
            print("\nCustomer account creation failed!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()