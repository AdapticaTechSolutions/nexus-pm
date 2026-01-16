# Supabase Troubleshooting Guide

## Common Issues and Solutions

### Error: "Database error saving new user"

This error occurs when trying to create/invite a user and the trigger fails.

#### Possible Causes:

1. **Trigger not created** - The `handle_new_user()` trigger hasn't been set up
2. **Profiles table doesn't exist** - Schema hasn't been run
3. **Email constraint violation** - Email already exists in profiles table
4. **Missing enum type** - `user_role` enum doesn't exist

#### Solution Steps:

**Step 1: Verify Schema is Created**

Run this query in SQL Editor:

```sql
-- Check if profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
);

-- Check if user_role enum exists
SELECT EXISTS (
    SELECT FROM pg_type 
    WHERE typname = 'user_role'
);
```

If either returns `false`, run `schema.sql` first.

**Step 2: Verify Trigger Exists**

```sql
-- Check if trigger exists
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';
```

If trigger doesn't exist, run `auth_triggers.sql`.

**Step 3: Check for Existing Profile**

If you're trying to invite a user that already has a profile:

```sql
-- Check if email already exists
SELECT * FROM profiles WHERE email = 'user@example.com';
```

If profile exists, delete it first or use a different email.

**Step 4: Test Trigger Manually**

Test if the trigger function works:

```sql
-- This should work if everything is set up correctly
SELECT handle_new_user();
```

**Step 5: Check Supabase Logs**

1. Go to **Project Settings** > **Logs** > **Auth Logs**
2. Look for detailed error messages
3. Common errors:
   - "relation profiles does not exist" → Run schema.sql
   - "type user_role does not exist" → Run schema.sql
   - "duplicate key value violates unique constraint" → Email already exists

**Step 6: Recreate Trigger (if needed)**

If trigger exists but isn't working, drop and recreate:

```sql
-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger (run auth_triggers.sql again)
```

### Error: "Failed to make POST request to auth/v1/invite"

This is usually a permissions issue or the trigger is failing.

**Solution:**

1. Check that you're using the correct API key (anon key, not service_role)
2. Verify RLS policies allow profile creation
3. Check Auth logs for detailed error

### Error: "relation does not exist"

**Solution:**

Run the schema.sql file in SQL Editor. Make sure all tables are created.

### Error: "permission denied for table profiles"

**Solution:**

The trigger function needs `SECURITY DEFINER` (which it has). If still failing:

```sql
-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON profiles TO postgres, anon, authenticated, service_role;
```

### Quick Fix: Complete Setup Checklist

Run these in order in SQL Editor:

1. ✅ **Run schema.sql** - Creates all tables and types
2. ✅ **Run rls_policies.sql** - Sets up security policies  
3. ✅ **Run auth_triggers.sql** - Creates user creation trigger

Then verify:

```sql
-- Quick verification query
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
    (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') as trigger_count,
    (SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user') as function_count;
```

All should return 1 or more.

### Manual User Creation (Workaround)

If trigger still fails, create user manually:

```sql
-- 1. Create user in auth (via dashboard or API)
-- 2. Then create profile manually:

INSERT INTO profiles (user_id, email, full_name, role)
VALUES (
    'user-uuid-from-auth-users',  -- Get this from auth.users table
    'user@example.com',
    'User Name',
    'team_member'
);
```

### Still Having Issues?

1. Check Supabase **Auth Logs** for detailed errors
2. Check **Database Logs** for SQL errors
3. Verify all SQL files ran successfully (no errors)
4. Make sure you're in the correct Supabase project
