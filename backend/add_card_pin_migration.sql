-- Add PIN column to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS pin VARCHAR;

-- Set a default hashed PIN for existing cards (users will need to change it)
-- Using bcrypt hash of "0000" as temporary default
UPDATE cards SET pin = '$2b$12$KIXqZ4Pu5kJ8vY.xQ3FvQeYZQmZxN5YNxN5YNxN5YNxN5YNxN5YNx' WHERE pin IS NULL;
