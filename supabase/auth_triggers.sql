/**
 * Nexus PM - Authentication Triggers
 * 
 * This file sets up triggers that automatically create user profiles
 * when a user signs up via Supabase Auth.
 * 
 * @module supabase/auth_triggers
 */

/**
 * Function to handle new user signup
 * 
 * Automatically creates a profile record when a user signs up.
 * Default role is 'team_member' unless specified otherwise.
 * 
 * Business Rules:
 * - Profile is created with email from auth.users
 * - Default role is 'team_member'
 * - Full name is extracted from auth.users metadata if available
 */
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_full_name TEXT;
    user_role user_role := 'team_member';
BEGIN
    -- Get email from auth.users
    user_email := NEW.email;
    
    -- Extract full name from metadata if available
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NULL
    );
    
    -- Check if role is specified in metadata (for admin creation, etc.)
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        user_role := (NEW.raw_user_meta_data->>'role')::user_role;
    END IF;
    
    -- Create profile
    INSERT INTO profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id,
        user_email,
        user_full_name,
        user_role
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Trigger to create profile on user signup
 * 
 * Fires after a new user is inserted into auth.users
 */
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

/**
 * Function to sync email updates
 * 
 * Updates profile email when auth.users email is changed
 */
CREATE OR REPLACE FUNCTION handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile email if auth email changed
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        UPDATE profiles
        SET email = NEW.email,
            updated_at = NOW()
        WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Trigger to sync email updates
 */
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION handle_user_email_update();

/**
 * Function to handle user deletion
 * 
 * Cascades deletion to profile (handled by CASCADE in schema)
 * This is mainly for documentation purposes
 */
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Profile deletion is handled by CASCADE constraint
    -- This function can be extended for additional cleanup if needed
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
