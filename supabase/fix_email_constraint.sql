/**
 * Fix Email Constraint Issue
 * 
 * The profiles table has a strict email validation constraint that might be
 * blocking inserts. This script makes the constraint more lenient or removes
 * it temporarily to test.
 */

-- Option 1: Make email constraint more lenient (recommended)
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS valid_email;

-- Create a more lenient email constraint (allows most valid emails)
ALTER TABLE profiles
ADD CONSTRAINT valid_email 
CHECK (email ~* '^.+@.+\..+$');  -- Just checks for @ and .

-- Option 2: Remove constraint entirely (for testing only - NOT recommended for production)
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_email;

-- Verify constraint was updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND conname = 'valid_email';
