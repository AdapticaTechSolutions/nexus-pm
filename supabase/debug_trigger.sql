/**
 * Debug Auth Trigger
 * 
 * This script helps identify why the trigger is failing.
 * It adds extensive logging and handles edge cases.
 */

-- Check current function
SELECT 
    proname,
    prosecdef,
    prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check if there are any users in auth.users
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE email IS NULL) as users_without_email,
    COUNT(*) FILTER (WHERE email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') as invalid_emails
FROM auth.users;

-- Check profiles table constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass;

-- Create a test function that will show us what's happening
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
    user_full_name TEXT;
    user_role user_role := 'team_member';
    profile_count INTEGER;
BEGIN
    -- Get email - this should always exist from auth.users
    user_email := NEW.email;
    
    -- Log what we received
    RAISE LOG 'Trigger fired for user: id=%, email=%, metadata=%', 
        NEW.id, user_email, NEW.raw_user_meta_data;
    
    -- Validate email format (match the constraint)
    IF user_email IS NULL OR user_email = '' THEN
        RAISE EXCEPTION 'User email is required but was NULL or empty';
    END IF;
    
    -- Check email format matches constraint
    IF user_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format: % (does not match constraint)', user_email;
    END IF;
    
    -- Extract full name
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NULL
    );
    
    -- Get role
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        BEGIN
            user_role := (NEW.raw_user_meta_data->>'role')::user_role;
        EXCEPTION
            WHEN OTHERS THEN
                user_role := 'team_member';
        END;
    END IF;
    
    -- Check if profile already exists
    SELECT COUNT(*) INTO profile_count
    FROM profiles
    WHERE user_id = NEW.id;
    
    IF profile_count > 0 THEN
        RAISE LOG 'Profile already exists for user %, updating', NEW.id;
        UPDATE profiles
        SET email = user_email,
            full_name = COALESCE(user_full_name, full_name),
            updated_at = NOW()
        WHERE user_id = NEW.id;
    ELSE
        RAISE LOG 'Creating new profile for user % with email %', NEW.id, user_email;
        
        -- Insert profile
        INSERT INTO profiles (user_id, email, full_name, role)
        VALUES (
            NEW.id,
            user_email,
            user_full_name,
            user_role
        );
        
        RAISE LOG 'Successfully created profile for user %', NEW.id;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log full error details
        RAISE LOG 'ERROR in handle_new_user: SQLSTATE=%, Message=%, Detail=%, User ID=%, Email=%', 
            SQLSTATE, SQLERRM, PG_EXCEPTION_DETAIL, NEW.id, user_email;
        
        -- Re-raise so we can see it in Supabase logs
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Test: Try to manually insert what the trigger would do
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    test_email TEXT := 'test' || extract(epoch from now())::text || '@example.com';
BEGIN
    RAISE NOTICE 'Testing profile insert with: id=%, email=%', test_id, test_email;
    
    INSERT INTO profiles (user_id, email, role)
    VALUES (test_id, test_email, 'team_member');
    
    RAISE NOTICE '✅ Manual insert test PASSED';
    
    DELETE FROM profiles WHERE user_id = test_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Manual insert test FAILED: %', SQLERRM;
        RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
END $$;
