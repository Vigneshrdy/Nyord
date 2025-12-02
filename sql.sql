-- -- -- ===========================
-- -- -- USERS
-- -- -- ===========================
-- -- CREATE TABLE users (
-- --     id SERIAL PRIMARY KEY,
-- --     username VARCHAR(100) UNIQUE NOT NULL,
-- --     email VARCHAR(150) UNIQUE NOT NULL,
-- --     password_hash TEXT NOT NULL,
-- --     full_name VARCHAR(150),
-- --     phone VARCHAR(20),
-- --     date_of_birth DATE,
-- --     address TEXT,
-- --     created_at TIMESTAMP DEFAULT NOW()
-- -- );

-- -- -- ===========================
-- -- -- ACCOUNTS
-- -- -- ===========================
-- -- CREATE TABLE accounts (
-- --     id SERIAL PRIMARY KEY,
-- --     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
-- --     account_number VARCHAR(30) UNIQUE NOT NULL,
-- --     balance NUMERIC(15,2) DEFAULT 0.00,
-- --     created_at TIMESTAMP DEFAULT NOW()
-- -- );

-- -- -- ===========================
-- -- -- TRANSACTIONS
-- -- -- ===========================
-- -- CREATE TABLE transactions (
-- --     id SERIAL PRIMARY KEY,
-- --     src_account INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
-- --     dest_account INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
-- --     amount NUMERIC(15,2) NOT NULL,
-- --     status VARCHAR(50) DEFAULT 'PENDING',
-- --     timestamp TIMESTAMP DEFAULT NOW()
-- -- );

-- -- -- ===========================
-- -- -- FIXED DEPOSITS
-- -- -- ===========================
-- -- CREATE TABLE fixed_deposits (
-- --     id SERIAL PRIMARY KEY,
-- --     fd_number VARCHAR(30) UNIQUE NOT NULL,
-- --     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
-- --     principal NUMERIC(15,2) NOT NULL,
-- --     rate NUMERIC(5,2) NOT NULL,
-- --     start_date DATE NOT NULL,
-- --     maturity_date DATE NOT NULL,
-- --     tenure_months INTEGER NOT NULL,
-- --     status VARCHAR(50) DEFAULT 'ACTIVE',
-- --     maturity_amount NUMERIC(15,2)
-- -- );

-- -- -- ===========================
-- -- -- LOANS
-- -- -- ===========================
-- -- CREATE TABLE loans (
-- --     id SERIAL PRIMARY KEY,
-- --     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
-- --     loan_type VARCHAR(100) NOT NULL,
-- --     principal NUMERIC(15,2) NOT NULL,
-- --     rate NUMERIC(5,2) NOT NULL,
-- --     tenure_months INTEGER NOT NULL,
-- --     start_date DATE NOT NULL,
-- --     emi NUMERIC(15,2) NOT NULL,
-- --     total_payable NUMERIC(15,2) NOT NULL,
-- --     amount_paid NUMERIC(15,2) DEFAULT 0,
-- --     outstanding NUMERIC(15,2) NOT NULL,
-- --     next_due_date DATE,
-- --     status VARCHAR(50) DEFAULT 'ACTIVE',
-- --     account_ref VARCHAR(100)
-- -- );

-- -- -- ===========================
-- -- -- LOAN PAYMENTS
-- -- -- ===========================
-- -- CREATE TABLE loan_payments (
-- --     id SERIAL PRIMARY KEY,
-- --     loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
-- --     amount NUMERIC(15,2) NOT NULL,
-- --     paid_at TIMESTAMP DEFAULT NOW()
-- -- );

-- -- -- ===========================
-- -- -- CARDS
-- -- -- ===========================
-- -- CREATE TABLE cards (
-- --     id SERIAL PRIMARY KEY,
-- --     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
-- --     card_number VARCHAR(50) UNIQUE NOT NULL,
-- --     card_type VARCHAR(50) NOT NULL,
-- --     card_holder VARCHAR(150) NOT NULL,
-- --     expiry_date VARCHAR(10) NOT NULL,
-- --     cvv VARCHAR(10) NOT NULL,
-- --     credit_limit NUMERIC(15,2) DEFAULT 5000.00,
-- --     available_credit NUMERIC(15,2) DEFAULT 5000.00,
-- --     status VARCHAR(50) DEFAULT 'ACTIVE',
-- --     issued_date DATE,
-- --     gradient_colors VARCHAR(200)
-- -- );
-- -- select current_user;
-- -- select * from users;
-- -- ALTER TABLE users RENAME COLUMN password_hash TO hashed_password;
-- -- ALTER TABLE cards ADD COLUMN IF NOT EXISTS pin VARCHAR;

-- -- Migration to add account_type column to accounts table
-- -- Run this SQL in your PostgreSQL database

-- -- -- Add account_type column with default value
-- -- ALTER TABLE accounts 
-- -- ADD COLUMN account_type VARCHAR(20) DEFAULT 'savings';

-- -- -- Update existing accounts to have 'savings' type if NULL
-- -- UPDATE accounts 
-- -- SET account_type = 'savings' 
-- -- WHERE account_type IS NULL;

-- -- -- Optional: Add a check constraint to ensure only valid account types
-- -- ALTER TABLE accounts 
-- -- ADD CONSTRAINT check_account_type 
-- -- CHECK (account_type IN ('savings', 'current'));

-- -- Verify the changes
--  -- SELECT id, account_number, account_type, balance, user_id FROM accounts LIMIT 10;
-- -- show create table  accounts;

-- -- ALTER TABLE accounts 
-- -- ADD COLUMN account_type VARCHAR(20) DEFAULT 'savings';
-- -- select * from accounts;
-- -- UPDATE accounts 
-- -- SET account_type = 'savings' 
-- -- WHERE account_type IS NULL;
-- -- ALTER TABLE accounts 
-- -- ADD CONSTRAINT check_account_type 
-- -- CHECK (account_type IN ('savings', 'current'));
-- -- SELECT id, account_number, account_type, balance, user_id FROM accounts LIMIT 10;
-- -- select * from users;
-- -- INSERT INTO users (username, email, hashed_password, role, full_name) 
-- -- VALUES ('admin2', 'admin2@nyordbank.com', '$hashed_password', 'admin', 'System Administrator');
-- -- select * from users;
-- -- Add approval system to database
-- -- Run this SQL in your PostgreSQL database

-- -- Add approval status to users (KYC approval)
-- ALTER TABLE users 
-- ADD COLUMN status VARCHAR(20) DEFAULT 'pending',
-- ADD COLUMN kyc_approved BOOLEAN DEFAULT FALSE,
-- ADD COLUMN approved_by INTEGER REFERENCES users(id),
-- ADD COLUMN approval_date TIMESTAMP,
-- ADD COLUMN rejection_reason TEXT;

-- -- Add constraint for user status
-- ALTER TABLE users 
-- ADD CONSTRAINT check_user_status 
-- CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

-- -- Add more KYC fields to users table
-- ALTER TABLE users 
-- ADD COLUMN government_id VARCHAR(50),
-- ADD COLUMN id_type VARCHAR(20) DEFAULT 'passport',
-- ADD COLUMN occupation VARCHAR(100),
-- ADD COLUMN annual_income NUMERIC(15,2),
-- ADD COLUMN employer_name VARCHAR(200),
-- ADD COLUMN employment_type VARCHAR(50),
-- ADD COLUMN nationality VARCHAR(50),
-- ADD COLUMN marital_status VARCHAR(20),
-- ADD COLUMN emergency_contact_name VARCHAR(150),
-- ADD COLUMN emergency_contact_phone VARCHAR(20),
-- ADD COLUMN emergency_contact_relation VARCHAR(50);

-- -- Add constraint for ID type
-- ALTER TABLE users 
-- ADD CONSTRAINT check_id_type 
-- CHECK (id_type IN ('passport', 'national_id', 'driving_license', 'other'));

-- -- Add constraint for employment type
-- ALTER TABLE users 
-- ADD CONSTRAINT check_employment_type 
-- CHECK (employment_type IN ('employed', 'self_employed', 'unemployed', 'student', 'retired', 'other'));

-- -- Add constraint for marital status
-- ALTER TABLE users 
-- ADD CONSTRAINT check_marital_status 
-- CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'other'));

-- -- Update cards table for approval
-- ALTER TABLE cards 
-- ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending',
-- ADD COLUMN approved_by INTEGER REFERENCES users(id),
-- ADD COLUMN approval_date TIMESTAMP,
-- ADD COLUMN rejection_reason TEXT;

-- -- Add constraint for card approval status
-- ALTER TABLE cards 
-- ADD CONSTRAINT check_card_approval_status 
-- CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- -- Update loans table for approval
-- ALTER TABLE loans 
-- ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending',
-- ADD COLUMN approved_by INTEGER REFERENCES users(id),
-- ADD COLUMN approval_date TIMESTAMP,
-- ADD COLUMN rejection_reason TEXT;

-- -- Add constraint for loan approval status
-- ALTER TABLE loans 
-- ADD CONSTRAINT check_loan_approval_status 
-- CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- -- Update fixed_deposits table for approval
-- ALTER TABLE fixed_deposits 
-- ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending',
-- ADD COLUMN approved_by INTEGER REFERENCES users(id),
-- ADD COLUMN approval_date TIMESTAMP,
-- ADD COLUMN rejection_reason TEXT;

-- -- Add constraint for fixed deposit approval status
-- ALTER TABLE fixed_deposits 
-- ADD CONSTRAINT check_fd_approval_status 
-- CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- -- Create approval notifications table
-- CREATE TABLE approval_notifications (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
--     request_type VARCHAR(50) NOT NULL,
--     request_id INTEGER,
--     status VARCHAR(20) DEFAULT 'pending',
--     message TEXT,
--     created_at TIMESTAMP DEFAULT NOW(),
--     updated_at TIMESTAMP DEFAULT NOW()
-- );

-- -- Add constraint for notification status
-- ALTER TABLE approval_notifications 
-- ADD CONSTRAINT check_notification_status 
-- CHECK (status IN ('pending', 'approved', 'rejected'));

-- -- Add constraint for request type
-- ALTER TABLE approval_notifications 
-- ADD CONSTRAINT check_request_type 
-- CHECK (request_type IN ('kyc', 'card', 'loan', 'fixed_deposit', 'account_activation'));

-- -- Update existing admin users to approved status
-- UPDATE users SET status = 'approved', kyc_approved = TRUE WHERE role = 'admin';

-- -- Verify the changes
-- SELECT id, username, status, kyc_approved, role FROM users;
-- select * from accounts join users on users.id=accounts.id;
-- update accounts set balance=22123 where id=6;
-- select * from accounts;

-- ===========================
-- NOTIFICATIONS
-- ===========================
-- CREATE TABLE notifications (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     title VARCHAR(255) NOT NULL,
--     message TEXT NOT NULL,
--     type VARCHAR(50) NOT NULL,
--     related_id INTEGER,
--     is_read BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP DEFAULT NOW(),
--     read_at TIMESTAMP NULL,
--     from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
-- );

-- -- Add constraint for notification type
-- ALTER TABLE notifications 
-- ADD CONSTRAINT check_notification_type 
-- CHECK (type IN ('loan_request', 'card_request', 'transaction', 'loan_approval', 'loan_rejection', 'card_approval', 'card_rejection', 'general'));

-- -- Add indexes for better performance
-- CREATE INDEX idx_notifications_user_id ON notifications(user_id);
-- CREATE INDEX idx_notifications_is_read ON notifications(is_read);
-- CREATE INDEX idx_notifications_type ON notifications(type);
-- CREATE INDEX idx_notifications_created_at ON notifications(created_at);
-- CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- -- Create audit logs table if not exists
-- CREATE TABLE IF NOT EXISTS auditlogs (
--     id SERIAL PRIMARY KEY,
--     event_type VARCHAR(100),
--     message TEXT,
--     timestamp TIMESTAMP DEFAULT NOW()
-- );

-- -- Add index for audit logs
-- CREATE INDEX idx_auditlogs_event_type ON auditlogs(event_type);
-- CREATE INDEX idx_auditlogs_timestamp ON auditlogs(timestamp);

-- -- Sample notification data (optional)
-- -- INSERT INTO notifications (user_id, title, message, type, from_user_id) 
-- -- VALUES 
-- -- (1, 'Welcome to Nyord Bank', 'Thank you for joining Nyord Bank. Your account has been created successfully.', 'general', NULL),
-- -- (1, 'Transaction Completed', 'Your transaction of $500 has been completed successfully.', 'transaction', NULL);

-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_notification_type') THEN
--         ALTER TABLE notifications 
--         ADD CONSTRAINT check_notification_type 
--         CHECK (type IN ('loan_request', 'card_request', 'transaction', 'loan_approval', 'loan_rejection', 'card_approval', 'card_rejection', 'general'));
--     END IF;
-- END $$;

-- -- Add indexes for better performance (only if not exists)
-- CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
-- CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
-- CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
-- CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
-- CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- -- Verify the table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'notifications' 
-- ORDER BY ordinal_position;

-- select * from notifications;


-- Additional schema changes for card-based transfers and enhanced notifications
-- Run these SQL commands to update your existing database

-- ===========================
-- MISSING FIELDS IN NOTIFICATIONS TABLE
-- ===========================

