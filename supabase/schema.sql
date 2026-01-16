/**
 * Nexus PM - Supabase Database Schema
 * 
 * This schema defines the complete database structure for the project management application.
 * It follows normalized database design principles with proper relationships, constraints, and indexes.
 * 
 * Architecture:
 * - Users are managed by Supabase Auth (auth.users)
 * - Profiles table extends auth.users with application-specific data
 * - Roles are stored in profiles and enforced via RLS policies
 * - All tables include created_at/updated_at timestamps for audit trails
 * - Soft deletes are used where appropriate (archived_at instead of hard delete)
 * 
 * @module supabase/schema
 */

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for secure random UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

/**
 * User roles in the system
 * - admin: Full system access
 * - team_member: Can work on assigned projects and tasks
 * - client: Read-only access except for ticket submission
 */
CREATE TYPE user_role AS ENUM ('admin', 'team_member', 'client');

/**
 * Project status lifecycle
 * - draft: Project is being planned
 * - active: Project is in progress
 * - archived: Project is completed or cancelled
 */
CREATE TYPE project_status AS ENUM ('draft', 'active', 'archived');

/**
 * Task status workflow (configurable per workspace, but these are defaults)
 */
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'blocked', 'done', 'cancelled');

/**
 * Task priority levels
 */
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

/**
 * Ticket types
 */
CREATE TYPE ticket_type AS ENUM ('inquiry', 'issue', 'feature_request', 'backlog_item');

/**
 * Ticket status workflow
 */
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled');

/**
 * Currency codes supported by the system
 */
CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'JPY', 'PHP', 'AUD');

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

/**
 * User profiles table
 * 
 * Extends Supabase auth.users with application-specific data.
 * One-to-one relationship with auth.users via user_id.
 * 
 * Business Rules:
 * - Every authenticated user must have a profile
 * - Role determines access level (enforced by RLS)
 * - Email is denormalized from auth.users for easier querying
 */
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'team_member',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for fast lookups by user_id and email
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================

/**
 * Clients table
 * 
 * Represents client organizations or individuals.
 * Clients can have multiple projects.
 * 
 * Business Rules:
 * - Each client must have a unique email
 * - Portal access can be enabled/disabled per client
 */
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    portal_access_enabled BOOLEAN NOT NULL DEFAULT true,
    portal_access_token TEXT, -- For future token-based authentication
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_client_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_company ON clients(company);

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================

/**
 * Teams table
 * 
 * Represents a collection of team members working together.
 * Teams can be assigned to projects and tasks.
 * 
 * Business Rules:
 * - Teams must have at least one member (enforced at application level)
 * - Teams cannot be deleted if assigned to projects/tasks (enforced at application level)
 */
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_name ON teams(name);

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TEAM MEMBERS TABLE
-- ============================================================================

/**
 * Team members table
 * 
 * Junction table linking profiles (users) to teams.
 * Represents membership of a user in a team.
 * 
 * Business Rules:
 * - A user can be a member of multiple teams
 * - A team can have multiple members
 * - Unique constraint prevents duplicate memberships
 */
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT, -- Optional role within the team (e.g., "Lead Developer", "Designer")
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate memberships
    UNIQUE(team_id, profile_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_profile_id ON team_members(profile_id);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

/**
 * Projects table
 * 
 * Top-level organizational unit representing a project.
 * Contains timeline, budget, and metadata.
 * 
 * Business Rules:
 * - Start date must be before end date (enforced at application level)
 * - Budget must be positive
 * - Only active projects can be modified (enforced at application level)
 * - Projects must be archived before deletion (soft delete)
 */
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    status project_status NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget_allocated DECIMAL(15, 2) NOT NULL CHECK (budget_allocated >= 0),
    budget_spent DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (budget_spent >= 0),
    currency currency_code NOT NULL DEFAULT 'USD',
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    
    CONSTRAINT valid_dates CHECK (start_date < end_date)
);

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PROJECT TEAMS TABLE
-- ============================================================================

/**
 * Project teams junction table
 * 
 * Links teams to projects (many-to-many relationship).
 * Represents which teams are assigned to work on a project.
 */
CREATE TABLE project_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(project_id, team_id)
);

CREATE INDEX idx_project_teams_project_id ON project_teams(project_id);
CREATE INDEX idx_project_teams_team_id ON project_teams(team_id);

-- ============================================================================
-- RESOURCE ALLOCATIONS TABLE
-- ============================================================================

/**
 * Resource allocations table
 * 
 * Tracks monthly billing rates for teams assigned to projects.
 * Used for budget tracking and cost calculations.
 * 
 * Business Rules:
 * - Monthly rate must be positive
 * - End date is optional (null means ongoing allocation)
 * - End date must be after start date if provided
 */
CREATE TABLE resource_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    monthly_rate DECIMAL(15, 2) NOT NULL CHECK (monthly_rate >= 0),
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_allocation_dates CHECK (end_date IS NULL OR start_date < end_date)
);

CREATE INDEX idx_resource_allocations_project_id ON resource_allocations(project_id);
CREATE INDEX idx_resource_allocations_team_id ON resource_allocations(team_id);
CREATE INDEX idx_resource_allocations_dates ON resource_allocations(start_date, end_date);

CREATE TRIGGER update_resource_allocations_updated_at
    BEFORE UPDATE ON resource_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BUDGET EXPENSES TABLE
-- ============================================================================

/**
 * Budget expenses table
 * 
 * Tracks manual expenses recorded against project budgets.
 * Separate from resource allocation costs (which are calculated).
 * 
 * Business Rules:
 * - Amount must be positive
 * - Expense date should be within project timeline (enforced at application level)
 */
CREATE TABLE budget_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_expense_amount CHECK (amount > 0)
);

CREATE INDEX idx_budget_expenses_project_id ON budget_expenses(project_id);
CREATE INDEX idx_budget_expenses_date ON budget_expenses(expense_date);
CREATE INDEX idx_budget_expenses_category ON budget_expenses(category);

-- ============================================================================
-- DELIVERABLES TABLE
-- ============================================================================

/**
 * Deliverables table
 * 
 * Represents expected outputs from a project.
 * Tracks completion status and due dates.
 */
CREATE TABLE deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    due_date DATE,
    completed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX idx_deliverables_completed ON deliverables(is_completed);

CREATE TRIGGER update_deliverables_updated_at
    BEFORE UPDATE ON deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TASK GROUPS TABLE
-- ============================================================================

/**
 * Task groups / Epics table
 * 
 * Represents a collection of related tasks grouped together.
 * Supports hierarchical grouping (parent_group_id for nested groups).
 * 
 * Business Rules:
 * - Parent group must exist if specified
 * - Circular references prevented at application level
 */
CREATE TABLE task_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_group_id UUID REFERENCES task_groups(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_groups_project_id ON task_groups(project_id);
CREATE INDEX idx_task_groups_parent ON task_groups(parent_group_id);

CREATE TRIGGER update_task_groups_updated_at
    BEFORE UPDATE ON task_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

/**
 * Tasks table
 * 
 * Represents a single unit of work within a project.
 * Supports dependencies, assignments, and workflow status.
 * 
 * Business Rules:
 * - Start date must be before end date
 * - Dependencies are validated at application level (no circular dependencies)
 * - Task cannot be marked done if dependencies are incomplete (application level)
 * - Status transitions follow configured workflow (application level)
 */
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    group_id UUID REFERENCES task_groups(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status task_status NOT NULL DEFAULT 'todo',
    priority task_priority NOT NULL DEFAULT 'medium',
    assignee_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    due_date DATE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_task_dates CHECK (start_date < end_date),
    CONSTRAINT valid_due_date CHECK (due_date IS NULL OR due_date >= start_date)
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_group_id ON tasks(group_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assignee_team ON tasks(assignee_team_id);
CREATE INDEX idx_tasks_dates ON tasks(start_date, end_date);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TASK DEPENDENCIES TABLE
-- ============================================================================

/**
 * Task dependencies table
 * 
 * Represents dependencies between tasks (task A depends on task B).
 * Used for Gantt chart visualization and workflow validation.
 * 
 * Business Rules:
 * - Task cannot depend on itself (enforced by CHECK constraint)
 * - Circular dependencies prevented at application level
 * - Both tasks must be in the same project (enforced at application level)
 */
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(task_id, depends_on_task_id),
    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);

CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- ============================================================================
-- TASK ASSIGNMENTS TABLE
-- ============================================================================

/**
 * Task assignments table
 * 
 * Links individual team members to tasks.
 * Allows fine-grained assignment beyond just team assignment.
 */
CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(task_id, profile_id)
);

CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_profile_id ON task_assignments(profile_id);

-- ============================================================================
-- MILESTONES TABLE
-- ============================================================================

/**
 * Milestones table
 * 
 * Represents significant points in the project timeline.
 * Can be linked to deliverables and tasks.
 */
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_target_date ON milestones(target_date);
CREATE INDEX idx_milestones_completed ON milestones(is_completed);

CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MILESTONE DELIVERABLES TABLE
-- ============================================================================

/**
 * Milestone deliverables junction table
 * 
 * Links deliverables to milestones (many-to-many).
 * Represents which deliverables must be completed for a milestone.
 */
CREATE TABLE milestone_deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(milestone_id, deliverable_id)
);

CREATE INDEX idx_milestone_deliverables_milestone ON milestone_deliverables(milestone_id);
CREATE INDEX idx_milestone_deliverables_deliverable ON milestone_deliverables(deliverable_id);

-- ============================================================================
-- MILESTONE TASKS TABLE
-- ============================================================================

/**
 * Milestone tasks junction table
 * 
 * Links tasks to milestones (many-to-many).
 * Represents which tasks should be completed by a milestone.
 */
CREATE TABLE milestone_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(milestone_id, task_id)
);

CREATE INDEX idx_milestone_tasks_milestone ON milestone_tasks(milestone_id);
CREATE INDEX idx_milestone_tasks_task ON milestone_tasks(task_id);

-- ============================================================================
-- TICKETS TABLE
-- ============================================================================

/**
 * Tickets table
 * 
 * Unified ticket system for inquiries, issues, feature requests, and backlog items.
 * Can be linked to projects, tasks, and milestones.
 * 
 * Business Rules:
 * - Clients can create tickets (read-only access otherwise)
 * - Status transitions follow configured workflow (application level)
 * - Resolution details recorded when ticket is resolved
 */
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    type ticket_type NOT NULL,
    status ticket_status NOT NULL DEFAULT 'open',
    priority task_priority NOT NULL DEFAULT 'medium',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reporter_name TEXT NOT NULL,
    reporter_email TEXT,
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_project_id ON tickets(project_id);
CREATE INDEX idx_tickets_type ON tickets(type);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_reporter ON tickets(reporter_id);
CREATE INDEX idx_tickets_assigned_team ON tickets(assigned_team_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TICKET TASKS TABLE
-- ============================================================================

/**
 * Ticket tasks junction table
 * 
 * Links tickets to related tasks (many-to-many).
 */
CREATE TABLE ticket_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(ticket_id, task_id)
);

CREATE INDEX idx_ticket_tasks_ticket ON ticket_tasks(ticket_id);
CREATE INDEX idx_ticket_tasks_task ON ticket_tasks(task_id);

-- ============================================================================
-- TICKET MILESTONES TABLE
-- ============================================================================

/**
 * Ticket milestones junction table
 * 
 * Links tickets to related milestones (many-to-many).
 */
CREATE TABLE ticket_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(ticket_id, milestone_id)
);

CREATE INDEX idx_ticket_milestones_ticket ON ticket_milestones(ticket_id);
CREATE INDEX idx_ticket_milestones_milestone ON ticket_milestones(milestone_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

/**
 * Schema creation complete.
 * 
 * Next steps:
 * 1. Set up Row Level Security (RLS) policies (see rls_policies.sql)
 * 2. Create database functions for complex queries (see functions.sql)
 * 3. Set up authentication triggers (see auth_triggers.sql)
 */
