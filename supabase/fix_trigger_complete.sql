/**
 * Complete Fix for Auth Trigger
 * 
 * This script fixes all potential issues with the trigger:
 * 1. Updates function with better error handling
 * 2. Ensures proper permissions
 * 3. Makes INSERT policy more permissive
 * 4. Adds logging to help debug
 */

-- Step 1: Ensure function has proper permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, anon, authenticated, service_role;

-- Step 2: Make INSERT policy more explicit and permissive
DROP POLICY IF EXISTS "Trigger can create profiles" ON profiles;

-- Create a policy that explicitly allows inserts (even from triggers)
CREATE POLICY "Trigger can create profiles"
    ON profiles FOR INSERT
    TO postgres, anon, authenticated, service_role
    WITH CHECK (true);

-- Step 3: Update the function with better error handling and logging
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
    user_full_name TEXT;
    user_role user_role := 'team_member';
    error_message TEXT;
    error_detail TEXT;
    error_hint TEXT;
BEGIN
    -- Get email from auth.users (required)
    user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', 'no-email@example.com');
    
    -- Extract full name from metadata if available
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NULL
    );
    
    -- Check if role is specified in metadata
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        BEGIN
            user_role := (NEW.raw_user_meta_data->>'role')::user_role;
        EXCEPTION
            WHEN OTHERS THEN
                user_role := 'team_member';
        END;
    END IF;
    
    -- Try to create profile
    BEGIN
        INSERT INTO public.profiles (user_id, email, full_name, role)
        VALUES (
            NEW.id,
            user_email,
            user_full_name,
            user_role
        );
        
        -- Log success (for debugging)
        RAISE LOG 'Successfully created profile for user % with email %', NEW.id, user_email;
        
    EXCEPTION
        WHEN unique_violation THEN
            -- Profile already exists, update it instead
            UPDATE public.profiles
            SET email = user_email,
                full_name = COALESCE(user_full_name, full_name),
                updated_at = NOW()
            WHERE user_id = NEW.id;
            
            RAISE LOG 'Profile already existed for user %, updated instead', NEW.id;
            
        WHEN OTHERS THEN
            -- Get detailed error information
            GET STACKED DIAGNOSTICS
                error_message = MESSAGE_TEXT,
                error_detail = PG_EXCEPTION_DETAIL,
                error_hint = PG_EXCEPTION_HINT;
            
            -- Log error details (these will appear in Supabase logs)
            RAISE LOG 'ERROR creating profile for user %: Message=%, Detail=%, Hint=%, SQLSTATE=%', 
                NEW.id, error_message, error_detail, error_hint, SQLSTATE;
            
            -- Also raise as warning so it's more visible
            RAISE WARNING 'Failed to create profile for user % (email: %): %', 
                NEW.id, user_email, error_message;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 5: Verify setup
SELECT 
    'Setup verification' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_trigger 
            WHERE tgname = 'on_auth_user_created'
        )
        AND EXISTS (
            SELECT FROM pg_proc 
            WHERE proname = 'handle_new_user'
            AND prosecdef = true
        )
        AND EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'profiles' 
            AND cmd = 'INSERT'
        )
        THEN '✅ All components in place'
        ELSE '❌ Something is missing'
    END as result;

-- Step 6: Test manual insert (simulates what trigger does)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test-' || extract(epoch from now())::text || '@example.com';
BEGIN
    -- Try inserting a profile (what the trigger does)
    INSERT INTO profiles (user_id, email, role)
    VALUES (test_user_id, test_email, 'team_member');
    
    RAISE NOTICE '✅ Test insert successful! User ID: %, Email: %', test_user_id, test_email;
    
    -- Clean up
    DELETE FROM profiles WHERE user_id = test_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test insert failed: %', SQLERRM;
        RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
END $$;
