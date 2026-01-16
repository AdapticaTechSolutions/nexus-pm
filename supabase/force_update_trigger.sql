/**
 * Force Update Auth Trigger
 * 
 * This script forcefully updates the trigger function to the latest version
 * and ensures everything is set up correctly.
 */

-- Drop and recreate the function with the latest version
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_full_name TEXT;
    user_role user_role := 'team_member';
    error_message TEXT;
BEGIN
    -- Get email from auth.users (required)
    user_email := NEW.email;
    
    -- Validate email exists
    IF user_email IS NULL OR user_email = '' THEN
        -- Don't fail user creation, just log warning
        RAISE WARNING 'User created without email: %', NEW.id;
        user_email := COALESCE(NEW.raw_user_meta_data->>'email', 'no-email@example.com');
    END IF;
    
    -- Extract full name from metadata if available
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NULL
    );
    
    -- Check if role is specified in metadata (for admin creation, etc.)
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        BEGIN
            user_role := (NEW.raw_user_meta_data->>'role')::user_role;
        EXCEPTION
            WHEN OTHERS THEN
                -- Invalid role, use default
                user_role := 'team_member';
                RAISE WARNING 'Invalid role specified, using default: %', NEW.raw_user_meta_data->>'role';
        END;
    END IF;
    
    -- Create profile using IF NOT EXISTS logic (more reliable than ON CONFLICT)
    BEGIN
        -- First check if profile already exists
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.id) THEN
            INSERT INTO profiles (user_id, email, full_name, role)
            VALUES (
                NEW.id,
                user_email,
                user_full_name,
                user_role
            );
        ELSE
            -- Profile exists, update it
            UPDATE profiles
            SET email = user_email,
                full_name = COALESCE(user_full_name, full_name),
                updated_at = NOW()
            WHERE user_id = NEW.id;
        END IF;
            
    EXCEPTION
        WHEN unique_violation THEN
            -- Profile already exists, that's okay - try update instead
            UPDATE profiles
            SET email = user_email,
                full_name = COALESCE(user_full_name, full_name),
                updated_at = NOW()
            WHERE user_id = NEW.id;
        WHEN OTHERS THEN
            -- Log detailed error for debugging but don't fail user creation
            error_message := SQLERRM;
            -- Use RAISE NOTICE to ensure it's logged in Supabase logs
            RAISE NOTICE 'Failed to create profile for user % (email: %): SQLSTATE=%, Message=%', 
                NEW.id, user_email, SQLSTATE, error_message;
            -- Still return NEW to allow user creation to succeed
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Verify it was created
SELECT 
    'Trigger status' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_trigger 
            WHERE tgname = 'on_auth_user_created'
        )
        THEN '✅ Trigger created successfully'
        ELSE '❌ Trigger creation failed'
    END as result;

-- Verify function exists
SELECT 
    'Function status' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc 
            WHERE proname = 'handle_new_user'
            AND prosecdef = true
        )
        THEN '✅ Function exists with SECURITY DEFINER'
        ELSE '❌ Function missing or incorrect'
    END as result;
