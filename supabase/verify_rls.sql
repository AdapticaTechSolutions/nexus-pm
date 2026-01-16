/**
 * Verify RLS is Enabled on All Nexus PM Tables
 * 
 * This script checks that all tables in our schema have RLS enabled.
 * Run this to ensure your database is secure.
 */

-- Check RLS status for all Nexus PM tables
SELECT 
    tablename as table_name,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ RLS NOT Enabled - SECURITY RISK!'
    END as rls_status,
    CASE 
        WHEN rowsecurity = false THEN 'Run: ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;'
        ELSE NULL
    END as fix_command
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'profiles',
    'clients',
    'teams',
    'team_members',
    'projects',
    'project_teams',
    'resource_allocations',
    'budget_expenses',
    'deliverables',
    'task_groups',
    'tasks',
    'task_dependencies',
    'task_assignments',
    'milestones',
    'milestone_deliverables',
    'milestone_tasks',
    'tickets',
    'ticket_tasks',
    'ticket_milestones'
)
ORDER BY 
    CASE WHEN rowsecurity = false THEN 0 ELSE 1 END,
    tablename;

-- Summary
SELECT 
    COUNT(*) FILTER (WHERE rowsecurity = true) as tables_with_rls,
    COUNT(*) FILTER (WHERE rowsecurity = false) as tables_without_rls,
    COUNT(*) as total_tables
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'profiles',
    'clients',
    'teams',
    'team_members',
    'projects',
    'project_teams',
    'resource_allocations',
    'budget_expenses',
    'deliverables',
    'task_groups',
    'tasks',
    'task_dependencies',
    'task_assignments',
    'milestones',
    'milestone_deliverables',
    'milestone_tasks',
    'tickets',
    'ticket_tasks',
    'ticket_milestones'
);

-- Check for tables that shouldn't exist (from other projects)
SELECT 
    '⚠️ Other tables found (not Nexus PM)' as warning,
    tablename as table_name,
    CASE 
        WHEN rowsecurity = true THEN 'RLS Enabled'
        ELSE 'RLS NOT Enabled - Consider enabling or removing'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT IN (
    'profiles',
    'clients',
    'teams',
    'team_members',
    'projects',
    'project_teams',
    'resource_allocations',
    'budget_expenses',
    'deliverables',
    'task_groups',
    'tasks',
    'task_dependencies',
    'task_assignments',
    'milestones',
    'milestone_deliverables',
    'milestone_tasks',
    'tickets',
    'ticket_tasks',
    'ticket_milestones'
)
ORDER BY tablename;
