/**
 * Fix RLS on Other Tables (Optional)
 * 
 * If you have other tables in your Supabase project (like payments, users, bookings)
 * that are showing security warnings, you can either:
 * 
 * Option 1: Enable RLS on them (if you need them)
 * Option 2: Delete them (if they're from old projects)
 * 
 * This script shows you how to enable RLS on common table names.
 * Modify as needed for your specific tables.
 */

-- Option 1: Enable RLS on other tables (uncomment and modify as needed)

-- ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;

-- Option 2: Create basic RLS policies for other tables
-- (Only do this if you need these tables)

-- Example for a generic 'users' table (if it exists and you need it):
-- CREATE POLICY "Users can view own record"
--     ON public.users FOR SELECT
--     USING (auth.uid()::text = id::text);
-- 
-- CREATE POLICY "Users can update own record"
--     ON public.users FOR UPDATE
--     USING (auth.uid()::text = id::text)
--     WITH CHECK (auth.uid()::text = id::text);

-- Option 3: Drop tables you don't need (BE CAREFUL - this deletes data!)
-- DROP TABLE IF EXISTS public.payments CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP TABLE IF EXISTS public.bookings CASCADE;

-- Recommendation: 
-- 1. First, run verify_rls.sql to see what tables exist
-- 2. Decide which tables you need
-- 3. For tables you need: Enable RLS and create policies
-- 4. For tables you don't need: Drop them to clean up
