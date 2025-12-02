-- Add missing card transaction columns to transactions table
-- Run this SQL in your PostgreSQL database

-- Add card transfer fields to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS src_card_id INTEGER REFERENCES cards(id);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS dest_card_id INTEGER REFERENCES cards(id);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(30) DEFAULT 'account_to_account';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('src_card_id', 'dest_card_id', 'transaction_type')
ORDER BY ordinal_position;