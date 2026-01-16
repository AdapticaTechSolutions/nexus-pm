/**
 * Test Auth Trigger
 * 
 * This script helps diagnose why the trigger is failing.
 * Run this to see what's happening when a user is created.
 */

-- 1. Check if trigger exists and is active
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check trigger function
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    prosrc as function_source
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Test the function manually (simulate what trigger does)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test-' || extract(epoch from now())::text || '@example.com';
    result TEXT;
BEGIN
    -- Try to insert a profile (what the trigger does)
    BEGIN
        INSERT INTO profiles (user_id, email, full_name, role)
        VALUES (test_user_id, test_email, 'Test User', 'team_member');
        
        RAISE NOTICE '✅ SUCCESS: Profile insert worked!';
        RAISE NOTICE 'User ID: %', test_user_id;
        RAISE NOTICE 'Email: %', test_email;
        
        -- Clean up
        DELETE FROM profiles WHERE user_id = test_user_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERROR: Profile insert failed!';
            RAISE NOTICE 'Error Code: %', SQLSTATE;
            RAISE NOTICE 'Error Message: %', SQLERRM;
            RAISE NOTICE 'Error Detail: %', SQLERRM;
    END;
END $$;

-- 4. Check for any existing profiles with issues
SELECT 
    id,
    user_id,
    email,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check if there are users in auth.users without profiles
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    au.created_at as auth_created_at,
    p.id as profile_id
FROM auth.users au
LEFT JOIN profiles p ON p.user_id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;
