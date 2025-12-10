-- Add created_at column to loans table
ALTER TABLE loans ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add created_at column to cards table  
ALTER TABLE cards ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have a created_at value (optional - sets to current time)
UPDATE loans SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE cards SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
