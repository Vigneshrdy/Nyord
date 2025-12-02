-- Updated Database Schema for Nyord Banking Application
-- Date: December 1, 2025
-- Changes: Added notification system and card-based transfer support

-- Users table (existing)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer', -- 'customer', 'admin'
    full_name VARCHAR(100),
    phone VARCHAR(15),
    date_of_birth DATE,
    address TEXT,
    nationality VARCHAR(50),
    government_id VARCHAR(50),
    kyc_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table (existing)
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(10) DEFAULT 'savings', -- 'savings', 'current'
    balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'blocked', 'closed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cards table (existing)
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    card_number VARCHAR(19) NOT NULL, -- Format: "1234 5678 9012 3456"
    card_type VARCHAR(20) NOT NULL, -- 'Standard', 'Gold', 'Platinum', 'Premium'
    card_holder VARCHAR(100) NOT NULL,
    expiry_date VARCHAR(5) NOT NULL, -- Format: "MM/YY"
    cvv VARCHAR(3) NOT NULL,
    pin VARCHAR(255) NOT NULL, -- Hashed PIN
    credit_limit DECIMAL(10,2) NOT NULL,
    available_credit DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'ACTIVE', 'BLOCKED', 'EXPIRED'
    issued_date DATE,
    gradient_colors VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- **UPDATED** Transactions table (added card support)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    src_account INTEGER REFERENCES accounts(id),
    dest_account INTEGER REFERENCES accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SUCCESS', 'FAILED'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- **NEW** Card-based transaction support
    src_card_id INTEGER REFERENCES cards(id), -- Source card for card-to-account transfers
    dest_card_id INTEGER REFERENCES cards(id), -- Destination card for account-to-card transfers
    transaction_type VARCHAR(30) DEFAULT 'account_to_account' -- 'account_to_account', 'card_to_account', 'account_to_card', 'card_to_card'
);

-- **NEW** Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'loan_request', 'card_request', 'transaction', 'loan_approval', 'loan_rejection', 'card_approval', 'card_rejection', 'general'
    related_id INTEGER, -- Reference to related entity (transaction_id, loan_id, card_id, etc.)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    from_user_id INTEGER REFERENCES users(id), -- User who triggered the notification (optional)
    from_user_name VARCHAR(100) -- Cached username for performance
);

-- Loans table (existing)
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    loan_type VARCHAR(50) NOT NULL,
    principal DECIMAL(15,2) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    tenure_months INTEGER NOT NULL,
    emi DECIMAL(15,2) NOT NULL,
    outstanding DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED'
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP,
    next_due_date DATE
);

-- Fixed Deposits table (existing)
CREATE TABLE fixed_deposits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    principal DECIMAL(15,2) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    start_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    tenure_months INTEGER NOT NULL,
    maturity_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'MATURED', 'PREMATURE_WITHDRAWAL'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table (existing)
CREATE TABLE auditlogs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100),
    message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- **NEW** Indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_from_user_id ON notifications(from_user_id);

CREATE INDEX idx_transactions_src_card_id ON transactions(src_card_id);
CREATE INDEX idx_transactions_dest_card_id ON transactions(dest_card_id);
CREATE INDEX idx_transactions_transaction_type ON transactions(transaction_type);

-- **NEW** Sample notification types and their purposes:
-- 
-- Notification Types:
-- - 'loan_request': When user applies for a loan (sent to admins)
-- - 'loan_approval': When admin approves a loan (sent to user)
-- - 'loan_rejection': When admin rejects a loan (sent to user)
-- - 'card_request': When user applies for a card (sent to admins)
-- - 'card_approval': When admin approves a card (sent to user)
-- - 'card_rejection': When admin rejects a card (sent to user)
-- - 'transaction': For completed transactions (sent to both sender and receiver)
-- - 'general': For general system notifications
--
-- Transaction Types:
-- - 'account_to_account': Traditional bank transfer between accounts
-- - 'card_to_account': Transfer from credit card to bank account
-- - 'account_to_card': Transfer from bank account to card (future feature)
-- - 'card_to_card': Transfer between cards (future feature)

-- **UPDATED** Foreign Key Constraints
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_src_card 
    FOREIGN KEY (src_card_id) REFERENCES cards(id);

ALTER TABLE transactions ADD CONSTRAINT fk_transactions_dest_card 
    FOREIGN KEY (dest_card_id) REFERENCES cards(id);

-- **NEW** Check constraints for data integrity
ALTER TABLE notifications ADD CONSTRAINT chk_notification_type 
    CHECK (type IN ('loan_request', 'card_request', 'transaction', 'loan_approval', 'loan_rejection', 'card_approval', 'card_rejection', 'general'));

ALTER TABLE transactions ADD CONSTRAINT chk_transaction_type 
    CHECK (transaction_type IN ('account_to_account', 'card_to_account', 'account_to_card', 'card_to_card'));

-- Ensure at least one source (account or card) is specified
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_source 
    CHECK ((src_account IS NOT NULL) OR (src_card_id IS NOT NULL));

-- Ensure at least one destination (account or card) is specified  
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_destination 
    CHECK ((dest_account IS NOT NULL) OR (dest_card_id IS NOT NULL));