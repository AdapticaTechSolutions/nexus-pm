/**
 * Fix Permissions for Auth Trigger
 * 
 * Run this if the trigger is failing due to permissions.
 * This grants necessary permissions for the trigger function.
 */

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all on profiles table to allow trigger to insert
GRANT ALL ON profiles TO postgres, anon, authenticated, service_role;

-- Ensure the function owner has proper permissions
ALTER FUNCTION handle_new_user() OWNER TO postgres;

-- Grant execute on function to authenticated users (for trigger)
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, anon, authenticated, service_role;

-- If RLS is blocking, we need to ensure the function can bypass it
-- The SECURITY DEFINER should handle this, but let's be explicit
ALTER FUNCTION handle_new_user() SECURITY DEFINER;

-- Verify permissions
SELECT 
    'Permissions check' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc p
            WHERE p.proname = 'handle_new_user'
            AND p.prosecdef = true
        )
        THEN '✅ Function has SECURITY DEFINER'
        ELSE '❌ Function missing SECURITY DEFINER'
    END as result;
