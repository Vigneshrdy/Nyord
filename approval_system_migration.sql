-- Add approval system to database
-- Run this SQL in your PostgreSQL database

-- Add approval status to users (KYC approval)
ALTER TABLE users 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN kyc_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN approved_by INTEGER REFERENCES users(id),
ADD COLUMN approval_date TIMESTAMP,
ADD COLUMN rejection_reason TEXT;

-- Add constraint for user status
ALTER TABLE users 
ADD CONSTRAINT check_user_status 
CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

-- Add more KYC fields to users table
ALTER TABLE users 
ADD COLUMN government_id VARCHAR(50),
ADD COLUMN id_type VARCHAR(20) DEFAULT 'passport',
ADD COLUMN occupation VARCHAR(100),
ADD COLUMN annual_income NUMERIC(15,2),
ADD COLUMN employer_name VARCHAR(200),
ADD COLUMN employment_type VARCHAR(50),
ADD COLUMN nationality VARCHAR(50),
ADD COLUMN marital_status VARCHAR(20),
ADD COLUMN emergency_contact_name VARCHAR(150),
ADD COLUMN emergency_contact_phone VARCHAR(20),
ADD COLUMN emergency_contact_relation VARCHAR(50);

-- Add constraint for ID type
ALTER TABLE users 
ADD CONSTRAINT check_id_type 
CHECK (id_type IN ('passport', 'national_id', 'driving_license', 'other'));

-- Add constraint for employment type
ALTER TABLE users 
ADD CONSTRAINT check_employment_type 
CHECK (employment_type IN ('employed', 'self_employed', 'unemployed', 'student', 'retired', 'other'));

-- Add constraint for marital status
ALTER TABLE users 
ADD CONSTRAINT check_marital_status 
CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'other'));

-- Update cards table for approval
ALTER TABLE cards 
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN approved_by INTEGER REFERENCES users(id),
ADD COLUMN approval_date TIMESTAMP,
ADD COLUMN rejection_reason TEXT;

-- Add constraint for card approval status
ALTER TABLE cards 
ADD CONSTRAINT check_card_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update loans table for approval
ALTER TABLE loans 
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN approved_by INTEGER REFERENCES users(id),
ADD COLUMN approval_date TIMESTAMP,
ADD COLUMN rejection_reason TEXT;

-- Add constraint for loan approval status
ALTER TABLE loans 
ADD CONSTRAINT check_loan_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update fixed_deposits table for approval
ALTER TABLE fixed_deposits 
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN approved_by INTEGER REFERENCES users(id),
ADD COLUMN approval_date TIMESTAMP,
ADD COLUMN rejection_reason TEXT;

-- Add constraint for fixed deposit approval status
ALTER TABLE fixed_deposits 
ADD CONSTRAINT check_fd_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create approval notifications table
CREATE TABLE approval_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    request_type VARCHAR(50) NOT NULL,
    request_id INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add constraint for notification status
ALTER TABLE approval_notifications 
ADD CONSTRAINT check_notification_status 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add constraint for request type
ALTER TABLE approval_notifications 
ADD CONSTRAINT check_request_type 
CHECK (request_type IN ('kyc', 'card', 'loan', 'fixed_deposit', 'account_activation'));

-- Update existing admin users to approved status
UPDATE users SET status = 'approved', kyc_approved = TRUE WHERE role = 'admin';

-- Verify the changes
SELECT id, username, status, kyc_approved, role FROM users;