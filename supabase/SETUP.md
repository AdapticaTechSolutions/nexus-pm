# Supabase Setup Guide

This guide walks you through setting up the Supabase backend for Nexus PM.

## Prerequisites

- Supabase account and project
- Access to Supabase SQL Editor
- Supabase project URL and API keys

## Step 1: Create Database Schema

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **Run** to execute the schema

This will create:
- All tables with proper relationships
- Indexes for performance
- Constraints for data integrity
- Enums for type safety

## Step 2: Set Up Row Level Security

1. In the SQL Editor, copy and paste the contents of `supabase/rls_policies.sql`
2. Click **Run** to create all RLS policies

This enables:
- Role-based access control
- Project-based access for team members
- Read-only access for clients
- Full access for admins

## Step 3: Set Up Authentication Triggers

1. In the SQL Editor, copy and paste the contents of `supabase/auth_triggers.sql`
2. Click **Run** to create authentication triggers

This ensures:
- User profiles are automatically created on signup
- Email updates are synced
- Default roles are assigned

## Step 4: Configure Authentication

1. Go to **Authentication** > **Settings** in Supabase dashboard
2. Enable **Email** provider
3. Configure email templates (optional)
4. Set up password requirements (recommended: min 8 characters)

## Step 5: Create Your First Admin User

### Option A: Via Supabase Dashboard

1. Go to **Authentication** > **Users**
2. Click **Add User** > **Create New User**
3. Enter email and password
4. After user is created, run this SQL to set admin role:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin@email.com';
```

### Option B: Via Signup with Metadata

When signing up via the app, you can set the role in the signup metadata:

```typescript
await signUp('admin@example.com', 'password', 'Admin User', 'admin');
```

**Note:** In production, restrict admin role assignment to prevent unauthorized admin creation.

## Step 6: Verify Setup

Run these queries to verify everything is set up correctly:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## Step 7: Test Authentication

1. Use the authentication service in `lib/supabase/auth.ts` to test:
   - Sign up a new user
   - Sign in
   - Get current session
   - Sign out

## Step 8: Test CRUD Operations

Use the services in `lib/supabase/services/` to test:
- Creating a project
- Creating tasks
- Creating teams
- Creating tickets

## Environment Variables (Optional)

For production, move Supabase credentials to environment variables:

```env
VITE_SUPABASE_URL=https://oqxdloxmajfkmuaxnzzp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_EZxE79MJIOeVhSHr1WNg_g_ONj1Rjv8
```

Then update `lib/supabase/client.ts`:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Troubleshooting

### RLS Policies Not Working

- Ensure RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Check user's role in profiles table
- Verify policies are created: `SELECT * FROM pg_policies WHERE tablename = 'table_name';`

### Authentication Not Creating Profiles

- Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Check trigger function: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
- Review Supabase logs for errors

### Foreign Key Violations

- Ensure parent records exist before creating child records
- Check CASCADE settings on foreign keys
- Verify data types match between tables

## Security Best Practices

1. **Never expose service_role key** in client-side code
2. **Use RLS policies** for all data access
3. **Validate input** at application level before database operations
4. **Use parameterized queries** (Supabase client handles this)
5. **Regularly review** RLS policies for correctness
6. **Monitor** Supabase logs for suspicious activity

## Next Steps

1. Integrate Supabase services into your React components
2. Replace mock data with real database queries
3. Add real-time subscriptions if needed
4. Set up database backups
5. Configure email templates for auth flows

## Support

For issues:
1. Check Supabase logs in dashboard
2. Review SQL error messages
3. Verify RLS policies match your access requirements
4. Consult Supabase documentation: https://supabase.com/docs
