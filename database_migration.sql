-- Migration script to add role column and create admin accounts
-- Run this in your PostgreSQL database

-- Add role column to users table
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) DEFAULT 'customer';

-- Update existing users to be customers
UPDATE users 
SET role = 'customer' 
WHERE role IS NULL;

-- Add constraint to ensure only valid roles
ALTER TABLE users 
ADD CONSTRAINT check_user_role 
CHECK (role IN ('customer', 'admin'));

-- Create admin accounts with proper hashed passwords
-- Note: These are bcrypt hashes for 'admin123'
INSERT INTO users (username, email, hashed_password, role, full_name) 
VALUES 
    ('vignesh', 'vignesh@nyordbank.com', '$2b$12$LQv3c1yqBwlVHpPjrU3HuOHrXkL5kmMvZiKiYwFQ9qrg.rQVQ5Rii', 'admin', 'Vignesh Admin'),
    ('admin', 'admin@nyordbank.com', '$2b$12$LQv3c1yqBwlVHpPjrU3HuOHrXkL5kmMvZiKiYwFQ9qrg.rQVQ5Rii', 'admin', 'System Administrator'),
    ('omar', 'omar@nyordbank.com', '$2b$12$LQv3c1yqBwlVHpPjrU3HuOHrXkL5kmMvZiKiYwFQ9qrg.rQVQ5Rii', 'admin', 'Omar Admin');

-- Verify the changes
SELECT id, username, email, role, full_name FROM users WHERE role = 'admin';