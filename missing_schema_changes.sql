-- Schema changes for card-based transactions support
-- Run these SQL commands to enable card-to-account transfers

-- ===========================
-- CARD-BASED TRANSFER SUPPORT
-- ===========================

-- Add card transfer fields to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS src_card_id INTEGER REFERENCES cards(id);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS dest_card_id INTEGER REFERENCES cards(id);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(30) DEFAULT 'account_to_account';

-- Add constraint for transaction type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_transaction_type') THEN
        ALTER TABLE transactions 
        ADD CONSTRAINT check_transaction_type 
        CHECK (transaction_type IN ('account_to_account', 'card_to_account', 'account_to_card', 'card_to_card'));
    END IF;
END $$;

-- Add constraint to ensure at least one source is specified
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_transaction_source') THEN
        ALTER TABLE transactions 
        ADD CONSTRAINT check_transaction_source 
        CHECK ((src_account IS NOT NULL) OR (src_card_id IS NOT NULL));
    END IF;
END $$;

-- Add constraint to ensure at least one destination is specified
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_transaction_destination') THEN
        ALTER TABLE transactions 
        ADD CONSTRAINT check_transaction_destination 
        CHECK ((dest_account IS NOT NULL) OR (dest_card_id IS NOT NULL));
    END IF;
END $$;

-- Ensure cards table has PIN field for secure transfers
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS pin VARCHAR(255);

-- ===========================
-- PERFORMANCE INDEXES FOR CARD TRANSACTIONS
-- ===========================

-- Add indexes for card-based transactions
CREATE INDEX IF NOT EXISTS idx_transactions_src_card_id ON transactions(src_card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_dest_card_id ON transactions(dest_card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions(transaction_type);

-- ===========================
-- VERIFICATION QUERIES
-- ===========================

-- Check if all required fields exist in transactions table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('src_card_id', 'dest_card_id', 'transaction_type')
ORDER BY ordinal_position;

-- Check if PIN field exists in cards table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'cards' 
AND column_name = 'pin';

-- Check transactions table structure
\d transactions;

-- View card transaction constraints
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass
AND conname LIKE 'check_%';