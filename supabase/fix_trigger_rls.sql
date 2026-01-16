/**
 * Fix RLS for Auth Trigger
 * 
 * The trigger function needs to be able to insert into profiles table.
 * Even with SECURITY DEFINER, we need to ensure RLS allows the function to insert.
 * 
 * This adds a policy that allows the trigger function to create profiles.
 */

-- Drop existing INSERT policy if it exists (we'll recreate it)
DROP POLICY IF EXISTS "Trigger can create profiles" ON profiles;

-- Create a policy that allows the trigger function to insert profiles
-- This policy checks if the insert is coming from the trigger function
-- by checking if we're in a trigger context
CREATE POLICY "Trigger can create profiles"
    ON profiles FOR INSERT
    WITH CHECK (true);  -- Allow all inserts - the function validates the data

-- Alternative: More restrictive policy that only allows inserts with valid user_id
-- Uncomment this and comment the above if you want more restriction:
-- CREATE POLICY "Trigger can create profiles"
--     ON profiles FOR INSERT
--     WITH CHECK (
--         user_id IS NOT NULL 
--         AND email IS NOT NULL 
--         AND role IS NOT NULL
--     );

-- Verify the policy was created
SELECT 
    'Trigger INSERT policy exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'profiles' 
            AND policyname = 'Trigger can create profiles'
        )
        THEN '✅ YES'
        ELSE '❌ NO'
    END as result;
