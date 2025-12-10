from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Account
from ..auth import get_current_user
from ..qr_utils import generate_account_qr_code, generate_account_qr_hash
from typing import List

router = APIRouter(prefix="/account-qr", tags=["Account QR Codes"])

@router.get("/my-accounts")
def get_all_account_qr_codes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate QR codes for all approved accounts belonging to the current user.
    Similar to UPI, each bank account gets its own unique QR code.
    """
    # Get all approved accounts for the user
    accounts = db.query(Account).filter(
        Account.user_id == current_user.id,
        Account.status == "approved"
    ).all()
    
    if not accounts:
        return {
            "message": "No approved accounts found",
            "accounts": []
        }
    
    # Generate QR code for each account
    account_qr_list = []
    for account in accounts:
        # Prepare account data for QR code
        account_data = {
            "account_number": account.account_number,
            "account_type": account.account_type,
            "user_name": current_user.full_name or current_user.username,
            "user_email": current_user.email,
            "balance": account.balance
        }
        
        # Generate QR code with payment URL
        qr_code_base64 = generate_account_qr_code(
            account.id, 
            account_data, 
            "http://localhost:3000"
        )
        qr_hash = generate_account_qr_hash(account.id)
        
        account_qr_list.append({
            "account_id": account.id,
            "account_number": account.account_number,
            "account_type": account.account_type,
            "balance": account.balance,
            "qr_code": qr_code_base64,
            "qr_hash": qr_hash,
            "created_at": account.created_at,
            "status": account.status
        })
    
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "total_accounts": len(account_qr_list),
        "accounts": account_qr_list,
        "message": f"Generated QR codes for {len(account_qr_list)} account(s)"
    }

@router.get("/account/{account_id}")
def get_single_account_qr_code(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate QR code for a specific account.
    Users can only generate QR codes for their own accounts.
    """
    # Get the account and verify ownership
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id,
        Account.status == "approved"
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or not approved"
        )
    
    # Prepare account data for QR code
    account_data = {
        "account_number": account.account_number,
        "account_type": account.account_type,
        "user_name": current_user.full_name or current_user.username,
        "user_email": current_user.email,
        "balance": account.balance
    }
    
    # Generate QR code with payment URL
    qr_code_base64 = generate_account_qr_code(
        account.id, 
        account_data, 
        "http://localhost:3000"
    )
    qr_hash = generate_account_qr_hash(account.id)
    
    return {
        "account_id": account.id,
        "account_number": account.account_number,
        "account_type": account.account_type,
        "balance": account.balance,
        "qr_code": qr_code_base64,
        "qr_hash": qr_hash,
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "created_at": account.created_at,
        "status": account.status,
        "message": "QR code generated successfully"
    }

@router.post("/decode-account-qr")
def decode_account_qr_data(
    qr_data: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Decode QR code data and extract account information for transactions.
    """
    try:
        from urllib.parse import urlparse, parse_qs
        
        # Parse the QR code URL
        if qr_data.startswith("http"):
            parsed_url = urlparse(qr_data)
            query_params = parse_qs(parsed_url.query)
            
            # Extract account ID and hash from URL parameters
            account_id = query_params.get("account", [None])[0]
            qr_hash = query_params.get("hash", [None])[0]
            
            if not account_id or not qr_hash:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid QR code format - missing parameters"
                )
            
            account_id = int(account_id)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid QR code format"
            )
        
        # Get account details
        target_account = db.query(Account).filter(Account.id == account_id).first()
        if not target_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Verify the QR hash
        expected_hash = generate_account_qr_hash(account_id)
        if qr_hash != expected_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or tampered QR code"
            )
        
        # Get account owner details
        account_owner = db.query(User).filter(User.id == target_account.user_id).first()
        
        return {
            "valid": True,
            "recipient_account": {
                "account_id": target_account.id,
                "account_number": target_account.account_number,
                "account_type": target_account.account_type,
                "owner_name": account_owner.full_name or account_owner.username,
                "owner_email": account_owner.email,
                "user_id": account_owner.id
            },
            "decoded_by": current_user.id,
            "can_transact": target_account.user_id != current_user.id
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid QR code format"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"QR decode failed: {str(e)}"
        )
