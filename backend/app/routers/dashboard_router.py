from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Account, Transaction, FixedDeposit, Loan, Card, User
from ..auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db), 
                         current_user: User = Depends(get_current_user)):
    """
    Get comprehensive dashboard summary for the current user including:
    - Account balances and count
    - Recent transactions
    - Monthly income/expenses
    - Fixed deposits summary
    - Loans summary
    - Cards summary
    """
    
    # Get all user accounts
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    account_ids = [acc.id for acc in accounts]
    
    # Calculate total balance
    total_balance = sum(acc.balance for acc in accounts) if accounts else 0.0
    
    # Get account summaries
    accounts_summary = [
        {
            "id": acc.id,
            "account_number": acc.account_number,
            "balance": float(acc.balance),
            "account_type": acc.account_type or 'savings'  # Use account_type from model or default to savings
        }
        for acc in accounts
    ]
    
    # Get recent transactions (last 10) with detailed account and user info
    recent_transactions = []
    if account_ids:
        transactions = db.query(Transaction).filter(
            or_(
                Transaction.src_account.in_(account_ids),
                Transaction.dest_account.in_(account_ids)
            )
        ).order_by(Transaction.timestamp.desc()).limit(10).all()
        
        for txn in transactions:
            is_debit = txn.src_account in account_ids
            
            # Get source account details
            src_account = db.query(Account).filter(Account.id == txn.src_account).first()
            src_user = db.query(User).filter(User.id == src_account.user_id).first() if src_account else None
            
            # Get destination account details  
            dest_account = db.query(Account).filter(Account.id == txn.dest_account).first()
            dest_user = db.query(User).filter(User.id == dest_account.user_id).first() if dest_account else None
            
            recent_transactions.append({
                "id": txn.id,
                "amount": float(txn.amount),
                "type": "debit" if is_debit else "credit",
                "status": txn.status,
                "timestamp": txn.timestamp.isoformat() if txn.timestamp else None,
                "src_account_number": src_account.account_number if src_account else None,
                "dest_account_number": dest_account.account_number if dest_account else None,
                "src_user_name": src_user.full_name or src_user.username if src_user else "Unknown",
                "dest_user_name": dest_user.full_name or dest_user.username if dest_user else "Unknown",
                "description": dest_user.full_name or dest_user.username if is_debit and dest_user else (src_user.full_name or src_user.username if not is_debit and src_user else "Transfer")
            })
    
    # Calculate monthly income and expenses (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    monthly_income = 0.0
    monthly_expenses = 0.0
    
    if account_ids:
        # Credits (money coming in)
        income_txns = db.query(func.sum(Transaction.amount)).filter(
            and_(
                Transaction.dest_account.in_(account_ids),
                Transaction.status == "SUCCESS",
                Transaction.timestamp >= thirty_days_ago
            )
        ).scalar()
        monthly_income = float(income_txns) if income_txns else 0.0
        
        # Debits (money going out)
        expense_txns = db.query(func.sum(Transaction.amount)).filter(
            and_(
                Transaction.src_account.in_(account_ids),
                Transaction.status == "SUCCESS",
                Transaction.timestamp >= thirty_days_ago
            )
        ).scalar()
        monthly_expenses = float(expense_txns) if expense_txns else 0.0
    
    # Fixed Deposits Summary
    fds = db.query(FixedDeposit).filter(FixedDeposit.user_id == current_user.id).all()
    fd_summary = {
        "count": len(fds),
        "total_investment": sum(float(fd.principal) for fd in fds),
        "total_maturity": sum(float(fd.maturity_amount) for fd in fds),
        "avg_rate": (sum(float(fd.rate) for fd in fds) / len(fds)) if fds else 0.0
    }
    
    # Loans Summary
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    active_loans = [loan for loan in loans if loan.status == "ACTIVE"]
    loan_summary = {
        "count": len(loans),
        "active_count": len(active_loans),
        "total_borrowed": sum(float(loan.principal) for loan in loans),
        "total_outstanding": sum(float(loan.outstanding) for loan in active_loans)
    }
    
    # Cards Summary
    cards = db.query(Card).filter(Card.user_id == current_user.id).all()
    active_cards = [card for card in cards if card.status == "ACTIVE"]
    card_summary = {
        "count": len(cards),
        "active_count": len(active_cards),
        "total_credit_limit": sum(float(card.credit_limit) for card in cards),
        "total_available": sum(float(card.available_credit) for card in active_cards)
    }
    
    # Calculate balance change percentage (comparing to 30 days ago)
    # This is a simplified version - in production you'd track historical balances
    balance_change_percent = 12.5  # Placeholder - can be calculated from transaction history
    income_change_percent = 8.2    # Placeholder
    expense_change_percent = -3.5  # Placeholder
    
    return {
        "total_balance": total_balance,
        "balance_change_percent": balance_change_percent,
        "monthly_income": monthly_income,
        "income_change_percent": income_change_percent,
        "monthly_expenses": monthly_expenses,
        "expense_change_percent": expense_change_percent,
        "accounts": accounts_summary,
        "accounts_count": len(accounts),
        "recent_transactions": recent_transactions,
        "fixed_deposits": fd_summary,
        "loans": loan_summary,
        "cards": card_summary
    }
