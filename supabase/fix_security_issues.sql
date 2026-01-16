/**
 * Fix Security Issues for Other Tables
 * 
 * This script fixes RLS issues for tables that aren't part of Nexus PM schema.
 * These tables (users, payments, bookings) are showing security warnings.
 * 
 * Choose one of the following options:
 * 1. Enable RLS and create basic policies (if you need these tables)
 * 2. Drop the tables (if you don't need them)
 */

-- ============================================================================
-- OPTION 1: Enable RLS on Existing Tables (if you need them)
-- ============================================================================

-- Enable RLS on users table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on users table';
    ELSE
        RAISE NOTICE 'ℹ️ users table does not exist';
    END IF;
END $$;

-- Enable RLS on payments table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on payments table';
    ELSE
        RAISE NOTICE 'ℹ️ payments table does not exist';
    END IF;
END $$;

-- Enable RLS on bookings table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
        ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on bookings table';
    ELSE
        RAISE NOTICE 'ℹ️ bookings table does not exist';
    END IF;
END $$;

-- ============================================================================
-- OPTION 2: Create Basic RLS Policies (if you need these tables)
-- ============================================================================

-- Basic policy for users table (if it exists and you need it)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Service role only" ON public.users;
        DROP POLICY IF EXISTS "Users can view own record" ON public.users;
        DROP POLICY IF EXISTS "Users can update own record" ON public.users;
        
        -- Create basic policies (modify as needed for your use case)
        -- Example: Users can only see/update their own records
        -- Uncomment and modify if needed:
        
        -- CREATE POLICY "Users can view own record"
        --     ON public.users FOR SELECT
        --     USING (auth.uid()::text = id::text OR id::text = auth.uid()::text);
        -- 
        -- CREATE POLICY "Users can update own record"
        --     ON public.users FOR UPDATE
        --     USING (auth.uid()::text = id::text OR id::text = auth.uid()::text)
        --     WITH CHECK (auth.uid()::text = id::text OR id::text = auth.uid()::text);
        
        RAISE NOTICE 'ℹ️ Add policies for users table as needed';
    END IF;
END $$;

-- Basic policy for payments table (if it exists and you need it)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow authenticated insert" ON public.payments;
        DROP POLICY IF EXISTS "Allow authenticated update" ON public.payments;
        DROP POLICY IF EXISTS "Allow authenticated delete" ON public.payments;
        
        -- Create basic policies (modify as needed)
        -- Example: Only authenticated users can access payments
        -- Uncomment and modify if needed:
        
        -- CREATE POLICY "Authenticated users can view payments"
        --     ON public.payments FOR SELECT
        --     USING (auth.role() = 'authenticated');
        -- 
        -- CREATE POLICY "Authenticated users can insert payments"
        --     ON public.payments FOR INSERT
        --     WITH CHECK (auth.role() = 'authenticated');
        
        RAISE NOTICE 'ℹ️ Add policies for payments table as needed';
    END IF;
END $$;

-- Basic policy for bookings table (if it exists and you need it)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow authenticated insert" ON public.bookings;
        DROP POLICY IF EXISTS "Allow authenticated update" ON public.bookings;
        DROP POLICY IF EXISTS "Allow authenticated delete" ON public.bookings;
        
        -- Create basic policies (modify as needed)
        -- Uncomment and modify if needed:
        
        -- CREATE POLICY "Authenticated users can view bookings"
        --     ON public.bookings FOR SELECT
        --     USING (auth.role() = 'authenticated');
        
        RAISE NOTICE 'ℹ️ Add policies for bookings table as needed';
    END IF;
END $$;

-- ============================================================================
-- OPTION 3: Drop Tables (if you don't need them)
-- ============================================================================

-- ⚠️ WARNING: Uncomment these only if you want to DELETE these tables and all their data!
-- This is irreversible!

-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP TABLE IF EXISTS public.payments CASCADE;
-- DROP TABLE IF EXISTS public.bookings CASCADE;

-- ============================================================================
-- Verification
-- ============================================================================

-- Check RLS status after fixes
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ RLS NOT Enabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'payments', 'bookings')
ORDER BY tablename;
