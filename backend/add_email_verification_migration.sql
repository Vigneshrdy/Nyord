-- Add email verification fields to users table
-- Run this SQL in your database to add the new fields

ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verified_at TIMESTAMP NULL;

-- Update existing users to have email_verified = false
UPDATE users SET email_verified = FALSE WHERE email_verified IS NULL;