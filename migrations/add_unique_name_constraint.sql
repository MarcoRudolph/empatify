-- Migration: Add unique constraint to users.name
-- This ensures that display names are unique across all users

-- First, check if there are any duplicate names
-- If duplicates exist, they need to be resolved before adding the constraint
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT name, COUNT(*) as cnt
    FROM users
    GROUP BY name
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Cannot add unique constraint: Found % duplicate names. Please resolve duplicates first.', duplicate_count;
  END IF;
END $$;

-- Add unique constraint to name column
ALTER TABLE users
ADD CONSTRAINT users_name_unique UNIQUE (name);

-- Add index for better performance on name lookups
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
