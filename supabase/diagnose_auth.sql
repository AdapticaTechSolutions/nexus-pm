/**
 * Diagnostic Script for Auth Trigger Issues
 * 
 * Run this script to diagnose why user creation is failing.
 * Copy the results and check each item.
 */

-- 1. Check if profiles table exists
SELECT 
    'Profiles table exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
        THEN '✅ YES'
        ELSE '❌ NO - Run schema.sql'
    END as result;

-- 2. Check if user_role enum exists
SELECT 
    'user_role enum exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT FROM pg_type WHERE typname = 'user_role')
        THEN '✅ YES'
        ELSE '❌ NO - Run schema.sql'
    END as result;

-- 3. Check if trigger function exists
SELECT 
    'handle_new_user function exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'handle_new_user')
        THEN '✅ YES'
        ELSE '❌ NO - Run auth_triggers.sql'
    END as result;

-- 4. Check if trigger exists
SELECT 
    'on_auth_user_created trigger exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created')
        THEN '✅ YES'
        ELSE '❌ NO - Run auth_triggers.sql'
    END as result;

-- 5. Check function permissions
SELECT 
    'Function has SECURITY DEFINER' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE p.proname = 'handle_new_user'
            AND p.prosecdef = true
        )
        THEN '✅ YES'
        ELSE '❌ NO - Function needs SECURITY DEFINER'
    END as result;

-- 6. Check if profiles table has RLS enabled
SELECT 
    'RLS enabled on profiles' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'profiles' 
            AND rowsecurity = true
        )
        THEN '✅ YES'
        ELSE '⚠️ NO - RLS might block trigger'
    END as result;

-- 7. Test function manually (this will show any errors)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test@example.com';
BEGIN
    -- Try to insert a test profile (simulating what trigger does)
    INSERT INTO profiles (user_id, email, role)
    VALUES (test_user_id, test_email, 'team_member');
    
    -- Clean up
    DELETE FROM profiles WHERE user_id = test_user_id;
    
    RAISE NOTICE '✅ Function test passed - trigger should work';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Function test failed: %', SQLERRM;
END $$;

-- 8. Check for existing profiles (might cause conflicts)
SELECT 
    'Existing profiles count' as check_name,
    COUNT(*)::text as result
FROM profiles;

-- 9. Check recent auth.users (to see if users are being created)
SELECT 
    'Recent auth.users count' as check_name,
    COUNT(*)::text as result
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 10. Check for users without profiles (orphaned users)
SELECT 
    'Users without profiles' as check_name,
    COUNT(*)::text as result
FROM auth.users au
LEFT JOIN profiles p ON p.user_id = au.id
WHERE p.id IS NULL;
