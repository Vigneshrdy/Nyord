-- Fix user login issues by updating existing customers to approved status
-- Run this SQL in your PostgreSQL database

-- Update all existing customer users to approved status
UPDATE users 
SET status = 'approved', kyc_approved = TRUE 
WHERE role = 'customer' AND status = 'pending';

-- Verify the changes
SELECT id, username, role, status, kyc_approved FROM users;