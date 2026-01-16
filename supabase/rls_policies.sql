/**
 * Nexus PM - Row Level Security (RLS) Policies
 * 
 * This file defines all RLS policies for the application.
 * RLS ensures that users can only access data they're authorized to see/modify.
 * 
 * Policy Strategy:
 * - Admins: Full access to everything
 * - Team Members: Can read/write projects and tasks they're assigned to
 * - Clients: Read-only access to their projects, can create tickets
 * 
 * @module supabase/rls_policies
 */

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_milestones ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Get the current user's profile
 * Returns the profile record for the authenticated user
 */
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS profiles AS $$
    SELECT * FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

/**
 * Check if current user is an admin
 * Returns true if the authenticated user has admin role
 */
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

/**
 * Check if current user is a client
 * Returns true if the authenticated user has client role
 */
CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'client'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

/**
 * Check if current user is assigned to a project
 * Returns true if user is a team member of a team assigned to the project
 */
CREATE OR REPLACE FUNCTION is_assigned_to_project(project_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM project_teams pt
        JOIN team_members tm ON tm.team_id = pt.team_id
        JOIN profiles p ON p.id = tm.profile_id
        WHERE pt.project_id = project_uuid 
        AND p.user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

/**
 * Check if current user is assigned to a task
 * Returns true if user is assigned directly or via team assignment
 */
CREATE OR REPLACE FUNCTION is_assigned_to_task(task_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = task_uuid
        AND (
            -- Direct assignment
            EXISTS (
                SELECT 1 FROM task_assignments ta
                JOIN profiles p ON p.id = ta.profile_id
                WHERE ta.task_id = task_uuid AND p.user_id = auth.uid()
            )
            OR
            -- Team assignment
            EXISTS (
                SELECT 1 FROM team_members tm
                JOIN profiles p ON p.id = tm.profile_id
                WHERE tm.team_id = t.assignee_team_id AND p.user_id = auth.uid()
            )
        )
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

/**
 * Check if current user owns a project (is the client)
 * Returns true if user's client profile matches project's client
 */
CREATE OR REPLACE FUNCTION is_project_client(project_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM projects p
        JOIN clients c ON c.id = p.client_id
        JOIN profiles pr ON pr.email = c.email
        WHERE p.id = project_uuid AND pr.user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

/**
 * Check if current user is a member of a team
 * Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion
 */
CREATE OR REPLACE FUNCTION is_user_in_team(team_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM team_members tm
        JOIN profiles p ON p.id = tm.profile_id
        WHERE tm.team_id = team_uuid 
        AND p.user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Allow trigger function to create profiles (for new user signup)
-- SECURITY DEFINER functions should bypass RLS, but we add this policy
-- to ensure the trigger can insert profiles during user creation
CREATE POLICY "Trigger can create profiles"
    ON profiles FOR INSERT
    WITH CHECK (true);  -- Allow all inserts from trigger function

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own profile (except role - that's admin only)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() 
        AND (role = (SELECT role FROM profiles WHERE user_id = auth.uid()) OR is_admin())
    );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- CLIENTS POLICIES
-- ============================================================================

-- Admins can do everything with clients
CREATE POLICY "Admins have full access to clients"
    ON clients FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read clients (for project context)
CREATE POLICY "Team members can read clients"
    ON clients FOR SELECT
    USING (
        is_admin() 
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.client_id = clients.id
            AND is_assigned_to_project(p.id)
        )
    );

-- Clients can read their own client record
CREATE POLICY "Clients can read own record"
    ON clients FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.email = clients.email
        )
    );

-- ============================================================================
-- TEAMS POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to teams"
    ON teams FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read teams they belong to
-- Uses helper function to avoid RLS recursion
CREATE POLICY "Team members can read their teams"
    ON teams FOR SELECT
    USING (
        is_admin()
        OR is_user_in_team(teams.id)
    );

-- Team members can read teams assigned to their projects
CREATE POLICY "Team members can read project teams"
    ON teams FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_teams pt
            WHERE pt.team_id = teams.id
            AND is_assigned_to_project(pt.project_id)
        )
    );

-- ============================================================================
-- TEAM MEMBERS POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to team members"
    ON team_members FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Users can read team memberships for teams they belong to
-- Uses helper function to avoid RLS recursion
CREATE POLICY "Users can read their team memberships"
    ON team_members FOR SELECT
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = team_members.profile_id AND p.user_id = auth.uid()
        )
        OR is_user_in_team(team_members.team_id)
    );

-- ============================================================================
-- PROJECTS POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to projects"
    ON projects FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read projects they're assigned to
CREATE POLICY "Team members can read assigned projects"
    ON projects FOR SELECT
    USING (
        is_admin()
        OR is_assigned_to_project(projects.id)
    );

-- Team members can update projects they're assigned to
-- Note: Status changes should be prevented at application level
-- RLS cannot easily check if status changed without OLD reference
CREATE POLICY "Team members can update assigned projects"
    ON projects FOR UPDATE
    USING (
        is_assigned_to_project(projects.id)
        AND status != 'archived' -- Cannot modify archived projects
    )
    WITH CHECK (
        is_assigned_to_project(projects.id)
        AND status != 'archived' -- Cannot change to archived (only admins can archive)
    );

-- Clients can read their own projects (read-only)
CREATE POLICY "Clients can read their projects"
    ON projects FOR SELECT
    USING (
        is_client() 
        AND is_project_client(projects.id)
    );

-- Team members can create projects (if they have permission)
CREATE POLICY "Team members can create projects"
    ON projects FOR INSERT
    WITH CHECK (
        is_admin() 
        OR (NOT is_client()) -- Non-clients can create projects
    );

-- Only admins can change project status (including archiving)
-- This policy allows admins to update any field, including status
CREATE POLICY "Only admins can change project status"
    ON projects FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- PROJECT TEAMS POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to project teams"
    ON project_teams FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read project teams for assigned projects
CREATE POLICY "Team members can read project teams"
    ON project_teams FOR SELECT
    USING (
        is_admin()
        OR is_assigned_to_project(project_teams.project_id)
    );

-- Team members can manage project teams for assigned projects
CREATE POLICY "Team members can manage project teams"
    ON project_teams FOR ALL
    USING (
        is_admin()
        OR is_assigned_to_project(project_teams.project_id)
    )
    WITH CHECK (
        is_admin()
        OR is_assigned_to_project(project_teams.project_id)
    );

-- ============================================================================
-- RESOURCE ALLOCATIONS POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to resource allocations"
    ON resource_allocations FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read resource allocations for assigned projects
CREATE POLICY "Team members can read resource allocations"
    ON resource_allocations FOR SELECT
    USING (
        is_admin()
        OR is_assigned_to_project(resource_allocations.project_id)
    );

-- Team members can manage resource allocations for assigned projects
CREATE POLICY "Team members can manage resource allocations"
    ON resource_allocations FOR ALL
    USING (
        is_admin()
        OR is_assigned_to_project(resource_allocations.project_id)
    )
    WITH CHECK (
        is_admin()
        OR is_assigned_to_project(resource_allocations.project_id)
    );

-- ============================================================================
-- BUDGET EXPENSES POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to budget expenses"
    ON budget_expenses FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read expenses for assigned projects
CREATE POLICY "Team members can read budget expenses"
    ON budget_expenses FOR SELECT
    USING (
        is_admin()
        OR is_assigned_to_project(budget_expenses.project_id)
    );

-- Team members can create expenses for assigned projects
CREATE POLICY "Team members can create budget expenses"
    ON budget_expenses FOR INSERT
    WITH CHECK (
        is_admin()
        OR is_assigned_to_project(budget_expenses.project_id)
    );

-- Team members can update/delete their own expenses
CREATE POLICY "Team members can manage own expenses"
    ON budget_expenses FOR UPDATE
    USING (
        is_admin()
        OR (is_assigned_to_project(budget_expenses.project_id) 
            AND created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()))
    )
    WITH CHECK (
        is_admin()
        OR (is_assigned_to_project(budget_expenses.project_id) 
            AND created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()))
    );

CREATE POLICY "Team members can delete own expenses"
    ON budget_expenses FOR DELETE
    USING (
        is_admin()
        OR (is_assigned_to_project(budget_expenses.project_id) 
            AND created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()))
    );

-- ============================================================================
-- DELIVERABLES POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to deliverables"
    ON deliverables FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read deliverables for assigned projects
CREATE POLICY "Team members can read deliverables"
    ON deliverables FOR SELECT
    USING (
        is_admin()
        OR is_assigned_to_project(deliverables.project_id)
    );

-- Clients can read deliverables for their projects
CREATE POLICY "Clients can read their deliverables"
    ON deliverables FOR SELECT
    USING (
        is_client()
        AND EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = deliverables.project_id
            AND is_project_client(p.id)
        )
    );

-- Team members can manage deliverables for assigned projects
CREATE POLICY "Team members can manage deliverables"
    ON deliverables FOR ALL
    USING (
        is_admin()
        OR is_assigned_to_project(deliverables.project_id)
    )
    WITH CHECK (
        is_admin()
        OR is_assigned_to_project(deliverables.project_id)
    );

-- ============================================================================
-- TASK GROUPS POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to task groups"
    ON task_groups FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read task groups for assigned projects
CREATE POLICY "Team members can read task groups"
    ON task_groups FOR SELECT
    USING (
        is_admin()
        OR is_assigned_to_project(task_groups.project_id)
    );

-- Team members can manage task groups for assigned projects
CREATE POLICY "Team members can manage task groups"
    ON task_groups FOR ALL
    USING (
        is_admin()
        OR is_assigned_to_project(task_groups.project_id)
    )
    WITH CHECK (
        is_admin()
        OR is_assigned_to_project(task_groups.project_id)
    );

-- ============================================================================
-- TASKS POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to tasks"
    ON tasks FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read tasks for assigned projects
CREATE POLICY "Team members can read assigned project tasks"
    ON tasks FOR SELECT
    USING (
        is_admin()
        OR is_assigned_to_project(tasks.project_id)
    );

-- Team members can read tasks assigned to them
CREATE POLICY "Team members can read assigned tasks"
    ON tasks FOR SELECT
    USING (
        is_assigned_to_task(tasks.id)
    );

-- Team members can create tasks for assigned projects
CREATE POLICY "Team members can create tasks"
    ON tasks FOR INSERT
    WITH CHECK (
        is_admin()
        OR is_assigned_to_project(tasks.project_id)
    );

-- Team members can update tasks assigned to them or in their projects
CREATE POLICY "Team members can update assigned tasks"
    ON tasks FOR UPDATE
    USING (
        is_admin()
        OR is_assigned_to_task(tasks.id)
        OR is_assigned_to_project(tasks.project_id)
    )
    WITH CHECK (
        is_admin()
        OR is_assigned_to_task(tasks.id)
        OR is_assigned_to_project(tasks.project_id)
    );

-- Team members can delete tasks they created (or admins)
CREATE POLICY "Team members can delete own tasks"
    ON tasks FOR DELETE
    USING (
        is_admin()
        OR (
            is_assigned_to_project(tasks.project_id)
            AND created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

-- ============================================================================
-- TASK DEPENDENCIES POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to task dependencies"
    ON task_dependencies FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read dependencies for tasks in assigned projects
CREATE POLICY "Team members can read task dependencies"
    ON task_dependencies FOR SELECT
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_dependencies.task_id
            AND is_assigned_to_project(t.project_id)
        )
    );

-- Team members can manage dependencies for tasks in assigned projects
CREATE POLICY "Team members can manage task dependencies"
    ON task_dependencies FOR ALL
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_dependencies.task_id
            AND is_assigned_to_project(t.project_id)
        )
    )
    WITH CHECK (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_dependencies.task_id
            AND is_assigned_to_project(t.project_id)
        )
    );

-- ============================================================================
-- TASK ASSIGNMENTS POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to task assignments"
    ON task_assignments FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read assignments for tasks in assigned projects
CREATE POLICY "Team members can read task assignments"
    ON task_assignments FOR SELECT
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_assignments.task_id
            AND is_assigned_to_project(t.project_id)
        )
    );

-- Team members can manage assignments for tasks in assigned projects
CREATE POLICY "Team members can manage task assignments"
    ON task_assignments FOR ALL
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_assignments.task_id
            AND is_assigned_to_project(t.project_id)
        )
    )
    WITH CHECK (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_assignments.task_id
            AND is_assigned_to_project(t.project_id)
        )
    );

-- ============================================================================
-- MILESTONES POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to milestones"
    ON milestones FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read milestones for assigned projects
CREATE POLICY "Team members can read milestones"
    ON milestones FOR SELECT
    USING (
        is_admin()
        OR is_assigned_to_project(milestones.project_id)
    );

-- Clients can read milestones for their projects
CREATE POLICY "Clients can read their milestones"
    ON milestones FOR SELECT
    USING (
        is_client()
        AND is_project_client(milestones.project_id)
    );

-- Team members can manage milestones for assigned projects
CREATE POLICY "Team members can manage milestones"
    ON milestones FOR ALL
    USING (
        is_admin()
        OR is_assigned_to_project(milestones.project_id)
    )
    WITH CHECK (
        is_admin()
        OR is_assigned_to_project(milestones.project_id)
    );

-- ============================================================================
-- MILESTONE DELIVERABLES POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to milestone deliverables"
    ON milestone_deliverables FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read milestone deliverables for assigned projects
CREATE POLICY "Team members can read milestone deliverables"
    ON milestone_deliverables FOR SELECT
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM milestones m
            WHERE m.id = milestone_deliverables.milestone_id
            AND is_assigned_to_project(m.project_id)
        )
    );

-- Team members can manage milestone deliverables for assigned projects
CREATE POLICY "Team members can manage milestone deliverables"
    ON milestone_deliverables FOR ALL
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM milestones m
            WHERE m.id = milestone_deliverables.milestone_id
            AND is_assigned_to_project(m.project_id)
        )
    )
    WITH CHECK (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM milestones m
            WHERE m.id = milestone_deliverables.milestone_id
            AND is_assigned_to_project(m.project_id)
        )
    );

-- ============================================================================
-- MILESTONE TASKS POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to milestone tasks"
    ON milestone_tasks FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read milestone tasks for assigned projects
CREATE POLICY "Team members can read milestone tasks"
    ON milestone_tasks FOR SELECT
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM milestones m
            WHERE m.id = milestone_tasks.milestone_id
            AND is_assigned_to_project(m.project_id)
        )
    );

-- Team members can manage milestone tasks for assigned projects
CREATE POLICY "Team members can manage milestone tasks"
    ON milestone_tasks FOR ALL
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM milestones m
            WHERE m.id = milestone_tasks.milestone_id
            AND is_assigned_to_project(m.project_id)
        )
    )
    WITH CHECK (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM milestones m
            WHERE m.id = milestone_tasks.milestone_id
            AND is_assigned_to_project(m.project_id)
        )
    );

-- ============================================================================
-- TICKETS POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to tickets"
    ON tickets FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read tickets for assigned projects
CREATE POLICY "Team members can read project tickets"
    ON tickets FOR SELECT
    USING (
        is_admin()
        OR (
            tickets.project_id IS NOT NULL
            AND is_assigned_to_project(tickets.project_id)
        )
        OR (
            tickets.reporter_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

-- Clients can read tickets for their projects
CREATE POLICY "Clients can read their tickets"
    ON tickets FOR SELECT
    USING (
        is_client()
        AND (
            EXISTS (
                SELECT 1 FROM projects p
                WHERE p.id = tickets.project_id
                AND is_project_client(p.id)
            )
            OR tickets.reporter_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

-- Anyone authenticated can create tickets (clients can submit inquiries)
CREATE POLICY "Authenticated users can create tickets"
    ON tickets FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Team members can update tickets for assigned projects
CREATE POLICY "Team members can update project tickets"
    ON tickets FOR UPDATE
    USING (
        is_admin()
        OR (
            tickets.project_id IS NOT NULL
            AND is_assigned_to_project(tickets.project_id)
        )
    )
    WITH CHECK (
        is_admin()
        OR (
            tickets.project_id IS NOT NULL
            AND is_assigned_to_project(tickets.project_id)
        )
    );

-- Users can update tickets they created (for status updates, etc.)
CREATE POLICY "Users can update own tickets"
    ON tickets FOR UPDATE
    USING (
        tickets.reporter_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        tickets.reporter_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================================================
-- TICKET TASKS POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to ticket tasks"
    ON ticket_tasks FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read ticket tasks for assigned projects
CREATE POLICY "Team members can read ticket tasks"
    ON ticket_tasks FOR SELECT
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_tasks.ticket_id
            AND (t.project_id IS NULL OR is_assigned_to_project(t.project_id))
        )
    );

-- Team members can manage ticket tasks for assigned projects
CREATE POLICY "Team members can manage ticket tasks"
    ON ticket_tasks FOR ALL
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_tasks.ticket_id
            AND (t.project_id IS NULL OR is_assigned_to_project(t.project_id))
        )
    )
    WITH CHECK (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_tasks.ticket_id
            AND (t.project_id IS NULL OR is_assigned_to_project(t.project_id))
        )
    );

-- ============================================================================
-- TICKET MILESTONES POLICIES
-- ============================================================================

-- Admins have full access
CREATE POLICY "Admins have full access to ticket milestones"
    ON ticket_milestones FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read ticket milestones for assigned projects
CREATE POLICY "Team members can read ticket milestones"
    ON ticket_milestones FOR SELECT
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_milestones.ticket_id
            AND (t.project_id IS NULL OR is_assigned_to_project(t.project_id))
        )
    );

-- Team members can manage ticket milestones for assigned projects
CREATE POLICY "Team members can manage ticket milestones"
    ON ticket_milestones FOR ALL
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_milestones.ticket_id
            AND (t.project_id IS NULL OR is_assigned_to_project(t.project_id))
        )
    )
    WITH CHECK (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_milestones.ticket_id
            AND (t.project_id IS NULL OR is_assigned_to_project(t.project_id))
        )
    );
