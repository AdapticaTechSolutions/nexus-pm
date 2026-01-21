# Nexus PM - Database Architecture Documentation

**Version:** 1.0  
**Last Updated:** January 2025  
**Database:** PostgreSQL 14+ (via Supabase)  
**Audience:** Database Administrators, Backend Developers, Technical Leads

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Design Principles](#design-principles)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Core Tables](#core-tables)
5. [Relationships & Foreign Keys](#relationships--foreign-keys)
6. [Indexes & Performance](#indexes--performance)
7. [Constraints & Validation](#constraints--validation)
8. [Enums & Types](#enums--types)
9. [Triggers & Functions](#triggers--functions)
10. [Row Level Security](#row-level-security)
11. [Data Flow & Queries](#data-flow--queries)
12. [Migration Strategy](#migration-strategy)
13. [Performance Optimization](#performance-optimization)
14. [Backup & Recovery](#backup--recovery)
15. [Best Practices](#best-practices)

---

## Database Overview

### Technology Stack

- **Database Engine**: PostgreSQL 14+
- **Hosting**: Supabase Cloud
- **Extensions**: `uuid-ossp`, `pgcrypto`
- **Authentication**: Supabase Auth (JWT-based)
- **Authorization**: Row Level Security (RLS)

### Database Statistics

- **Total Tables**: 20+
- **Total Indexes**: 50+
- **Total Functions**: 10+
- **Total Triggers**: 15+
- **RLS Policies**: 50+

### Design Philosophy

Nexus PM database follows these principles:

1. **Normalization**: Third Normal Form (3NF) to eliminate redundancy
2. **Referential Integrity**: Foreign keys with appropriate CASCADE behavior
3. **Data Validation**: Constraints at database level
4. **Audit Trails**: Timestamps on all tables
5. **Soft Deletes**: `archived_at` for important entities
6. **Security First**: RLS policies on all tables
7. **Performance**: Strategic indexes on foreign keys and frequently queried fields

---

## Design Principles

### 1. Normalization

The database is normalized to **Third Normal Form (3NF)**:

- **No redundant data**: Each fact stored once
- **Proper relationships**: Foreign keys maintain referential integrity
- **Junction tables**: Many-to-many relationships properly modeled

**Example:**
- Projects don't store team member details directly
- Instead: `projects` → `project_teams` → `teams` → `team_members` → `profiles`

### 2. Referential Integrity

All relationships use foreign keys with appropriate CASCADE behavior:

- **CASCADE**: Delete child records when parent is deleted
- **RESTRICT**: Prevent deletion if children exist
- **SET NULL**: Set foreign key to NULL when parent is deleted

### 3. Data Validation

Constraints enforce business rules at database level:

- **CHECK constraints**: Validate dates, amounts, email formats
- **UNIQUE constraints**: Prevent duplicates
- **NOT NULL**: Ensure required fields

### 4. Audit Trails

Every table includes:

- `created_at TIMESTAMPTZ`: When record was created
- `updated_at TIMESTAMPTZ`: When record was last updated (auto-updated via trigger)
- `archived_at TIMESTAMPTZ`: When record was archived (soft delete)

### 5. Security

- **Row Level Security (RLS)**: Enabled on all tables
- **Role-based access**: Admin, team_member, client roles
- **Project-based access**: Team members see only assigned projects
- **Client isolation**: Clients see only their own projects

---

## Entity Relationship Diagram

### High-Level ERD

```
┌─────────────┐
│ auth.users  │ (Supabase Auth)
└──────┬──────┘
       │ 1:1
       ▼
┌─────────────┐
│  profiles   │──┐
└─────────────┘  │
                 │ N:M
┌─────────────┐  │    ┌─────────────┐
│   clients   │  │    │    teams    │
└──────┬──────┘  │    └──────┬──────┘
       │ 1:N     │           │ N:M
       ▼         │           │
┌─────────────┐  │           │
│  projects   │◄─┘           │
└──────┬──────┘              │
       │ 1:N                 │
       │                     │
       ├──► deliverables     │
       ├──► tasks            │
       ├──► milestones       │
       ├──► budget_expenses  │
       └──► resource_allocations ◄──┘
```

### Detailed Relationships

```
profiles (1) ──< (N) team_members (N) >── (1) teams
profiles (1) ──< (N) projects (created_by)
profiles (1) ──< (N) tasks (created_by)
profiles (1) ──< (N) tickets (reporter_id, resolved_by)

clients (1) ──< (N) projects

teams (1) ──< (N) team_members
teams (1) ──< (N) project_teams (N) >── (1) projects
teams (1) ──< (N) tasks (assignee_team_id)
teams (1) ──< (N) resource_allocations

projects (1) ──< (N) tasks
projects (1) ──< (N) deliverables
projects (1) ──< (N) milestones
projects (1) ──< (N) budget_expenses
projects (1) ──< (N) resource_allocations
projects (1) ──< (N) project_teams
projects (N) >── (1) tickets

tasks (1) ──< (N) task_dependencies (self-referential)
tasks (1) ──< (N) task_assignments
tasks (N) >── (1) task_groups
tasks (N) >── (1) milestone_tasks (N) >── (1) milestones
tasks (N) >── (1) ticket_tasks (N) >── (1) tickets

milestones (1) ──< (N) milestone_deliverables (N) >── (1) deliverables
milestones (1) ──< (N) milestone_tasks
```

---

## Core Tables

### 1. Profiles Table

**Purpose**: Extends Supabase `auth.users` with application-specific data

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'team_member',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
```

**Key Features:**
- One-to-one with `auth.users`
- Role-based access control
- Email denormalized for easier querying
- Auto-updated `updated_at` via trigger

**Indexes:**
- `idx_profiles_user_id` on `user_id`
- `idx_profiles_email` on `email`
- `idx_profiles_role` on `role`

### 2. Clients Table

**Purpose**: Represents client organizations or individuals

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    portal_access_enabled BOOLEAN NOT NULL DEFAULT true,
    portal_access_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_client_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
```

**Key Features:**
- Unique email constraint
- Portal access control
- Company information

**Indexes:**
- `idx_clients_email` on `email`
- `idx_clients_company` on `company`

### 3. Teams Table

**Purpose**: Represents collections of team members

```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Features:**
- Simple structure for team collections
- Members linked via `team_members` junction table

**Indexes:**
- `idx_teams_name` on `name`

### 4. Team Members Table

**Purpose**: Junction table linking profiles to teams

```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(team_id, profile_id)
);
```

**Key Features:**
- Many-to-many relationship: Teams ↔ Profiles
- Prevents duplicate memberships
- Optional role within team

**Indexes:**
- `idx_team_members_team_id` on `team_id`
- `idx_team_members_profile_id` on `profile_id`

### 5. Projects Table

**Purpose**: Top-level organizational unit

```sql
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
```

**Key Features:**
- Budget tracking (allocated vs spent)
- Multi-currency support
- Soft delete via `archived_at`
- Date validation constraint
- RESTRICT on client deletion (prevents orphaned projects)

**Indexes:**
- `idx_projects_client_id` on `client_id`
- `idx_projects_status` on `status`
- `idx_projects_created_by` on `created_by`
- `idx_projects_dates` on `(start_date, end_date)`

### 6. Tasks Table

**Purpose**: Individual work items within projects

```sql
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
```

**Key Features:**
- Workflow status tracking
- Priority levels
- Team assignment
- Optional grouping
- Date validation

**Indexes:**
- `idx_tasks_project_id` on `project_id`
- `idx_tasks_group_id` on `group_id`
- `idx_tasks_status` on `status`
- `idx_tasks_priority` on `priority`
- `idx_tasks_assignee_team` on `assignee_team_id`
- `idx_tasks_dates` on `(start_date, end_date)`
- `idx_tasks_created_by` on `created_by`

### 7. Task Dependencies Table

**Purpose**: Represents dependencies between tasks

```sql
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(task_id, depends_on_task_id),
    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);
```

**Key Features:**
- Self-referential relationship
- Prevents self-dependencies
- Prevents duplicate dependencies

**Indexes:**
- `idx_task_dependencies_task_id` on `task_id`
- `idx_task_dependencies_depends_on` on `depends_on_task_id`

### 8. Tickets Table

**Purpose**: Unified ticketing system

```sql
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
```

**Key Features:**
- Multiple ticket types
- Optional project linkage
- Resolution tracking
- Reporter information

**Indexes:**
- `idx_tickets_project_id` on `project_id`
- `idx_tickets_type` on `type`
- `idx_tickets_status` on `status`
- `idx_tickets_priority` on `priority`
- `idx_tickets_reporter` on `reporter_id`
- `idx_tickets_assigned_team` on `assigned_team_id`
- `idx_tickets_created_at` on `created_at`

### 9. Budget Expenses Table

**Purpose**: Manual expenses against project budgets

```sql
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
```

**Key Features:**
- Categorization
- Positive amount validation
- Creator tracking

**Indexes:**
- `idx_budget_expenses_project_id` on `project_id`
- `idx_budget_expenses_date` on `expense_date`
- `idx_budget_expenses_category` on `category`

### 10. Resource Allocations Table

**Purpose**: Monthly billing rates for teams on projects

```sql
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
```

**Key Features:**
- Monthly rate tracking
- Optional end date (ongoing allocations)
- Date validation

**Indexes:**
- `idx_resource_allocations_project_id` on `project_id`
- `idx_resource_allocations_team_id` on `team_id`
- `idx_resource_allocations_dates` on `(start_date, end_date)`

---

## Relationships & Foreign Keys

### Relationship Summary

| Parent Table | Child Table | Relationship | CASCADE Behavior |
|-------------|-------------|--------------|------------------|
| `auth.users` | `profiles` | 1:1 | CASCADE |
| `clients` | `projects` | 1:N | RESTRICT |
| `profiles` | `projects` (created_by) | 1:N | SET NULL |
| `profiles` | `tasks` (created_by) | 1:N | SET NULL |
| `profiles` | `tickets` (reporter_id) | 1:N | SET NULL |
| `profiles` | `tickets` (resolved_by) | 1:N | SET NULL |
| `profiles` | `team_members` | 1:N | CASCADE |
| `teams` | `team_members` | 1:N | CASCADE |
| `teams` | `tasks` (assignee_team_id) | 1:N | SET NULL |
| `teams` | `tickets` (assigned_team_id) | 1:N | SET NULL |
| `projects` | `tasks` | 1:N | CASCADE |
| `projects` | `deliverables` | 1:N | CASCADE |
| `projects` | `milestones` | 1:N | CASCADE |
| `projects` | `budget_expenses` | 1:N | CASCADE |
| `projects` | `resource_allocations` | 1:N | CASCADE |
| `projects` | `project_teams` | 1:N | CASCADE |
| `projects` | `tickets` | 1:N | SET NULL |
| `tasks` | `task_dependencies` (self-ref) | N:M | CASCADE |
| `task_groups` | `tasks` | 1:N | SET NULL |
| `task_groups` | `task_groups` (parent) | Self-ref | SET NULL |

### CASCADE Behavior Explained

#### ON DELETE CASCADE
Used when child records should be deleted with parent:
- `profiles` → `team_members`: If profile deleted, remove memberships
- `projects` → `tasks`: If project deleted, remove all tasks
- `teams` → `team_members`: If team deleted, remove memberships

#### ON DELETE RESTRICT
Used to prevent deletion if children exist:
- `clients` → `projects`: Cannot delete client with active projects

#### ON DELETE SET NULL
Used when child should remain but reference should be cleared:
- `profiles` → `projects` (created_by): Keep project, clear creator
- `teams` → `tasks` (assignee_team_id): Keep task, clear assignment

---

## Indexes & Performance

### Index Strategy

Indexes are created on:
1. **All foreign keys** - For join performance
2. **Frequently queried fields** - Status, dates, emails
3. **Composite indexes** - For common query patterns

### Index List

#### Profiles Indexes
```sql
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
```

#### Projects Indexes
```sql
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date); -- Composite
```

#### Tasks Indexes
```sql
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_group_id ON tasks(group_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assignee_team ON tasks(assignee_team_id);
CREATE INDEX idx_tasks_dates ON tasks(start_date, end_date); -- Composite
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
```

#### Tickets Indexes
```sql
CREATE INDEX idx_tickets_project_id ON tickets(project_id);
CREATE INDEX idx_tickets_type ON tickets(type);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_reporter ON tickets(reporter_id);
CREATE INDEX idx_tickets_assigned_team ON tickets(assigned_team_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
```

### Query Optimization Examples

#### Optimized Project Query
```sql
-- Uses indexes on status and dates
SELECT * FROM projects
WHERE status = 'active'
  AND start_date <= CURRENT_DATE
  AND end_date >= CURRENT_DATE
ORDER BY created_at DESC;
```

#### Optimized Task Query with Joins
```sql
-- Uses indexes on project_id, status, and assignee_team_id
SELECT t.*, p.name as project_name, tm.name as team_name
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN teams tm ON t.assignee_team_id = tm.id
WHERE t.project_id = $1
  AND t.status = 'in_progress'
ORDER BY t.priority DESC, t.due_date ASC;
```

---

## Constraints & Validation

### Check Constraints

#### Date Validation
```sql
-- Projects: Start date must be before end date
CONSTRAINT valid_dates CHECK (start_date < end_date)

-- Tasks: Start date must be before end date
CONSTRAINT valid_task_dates CHECK (start_date < end_date)

-- Tasks: Due date must be after start date
CONSTRAINT valid_due_date CHECK (due_date IS NULL OR due_date >= start_date)

-- Resource Allocations: End date must be after start date
CONSTRAINT valid_allocation_dates CHECK (end_date IS NULL OR start_date < end_date)
```

#### Amount Validation
```sql
-- Projects: Budget must be non-negative
CHECK (budget_allocated >= 0)
CHECK (budget_spent >= 0)

-- Budget Expenses: Amount must be positive
CHECK (amount > 0)

-- Resource Allocations: Rate must be non-negative
CHECK (monthly_rate >= 0)
```

#### Email Validation
```sql
-- Profiles: Valid email format
CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')

-- Clients: Valid email format
CONSTRAINT valid_client_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
```

#### Self-Reference Prevention
```sql
-- Task Dependencies: Cannot depend on itself
CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
```

### Unique Constraints

```sql
-- Profiles: One profile per user
UNIQUE(user_id)

-- Clients: Unique email
UNIQUE(email)

-- Team Members: No duplicate memberships
UNIQUE(team_id, profile_id)

-- Project Teams: No duplicate assignments
UNIQUE(project_id, team_id)

-- Task Dependencies: No duplicate dependencies
UNIQUE(task_id, depends_on_task_id)
```

---

## Enums & Types

### User Role Enum

```sql
CREATE TYPE user_role AS ENUM ('admin', 'team_member', 'client');
```

**Usage:**
- `profiles.role`
- Determines access level via RLS policies

### Project Status Enum

```sql
CREATE TYPE project_status AS ENUM ('draft', 'active', 'archived');
```

**Usage:**
- `projects.status`
- Lifecycle: draft → active → archived

### Task Status Enum

```sql
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'blocked', 'done', 'cancelled');
```

**Usage:**
- `tasks.status`
- Workflow transitions enforced at application level

### Task Priority Enum

```sql
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
```

**Usage:**
- `tasks.priority`
- `tickets.priority`

### Ticket Type Enum

```sql
CREATE TYPE ticket_type AS ENUM ('inquiry', 'issue', 'feature_request', 'backlog_item');
```

**Usage:**
- `tickets.type`

### Ticket Status Enum

```sql
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled');
```

**Usage:**
- `tickets.status`

### Currency Code Enum

```sql
CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'JPY', 'PHP', 'AUD');
```

**Usage:**
- `projects.currency`

---

## Triggers & Functions

### Update Timestamp Trigger

**Function:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Usage:**
Applied to all tables with `updated_at` column:
- `profiles`
- `clients`
- `teams`
- `projects`
- `tasks`
- `deliverables`
- `milestones`
- `tickets`
- `resource_allocations`
- `task_groups`

**Trigger Example:**
```sql
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Authentication Triggers

#### Handle New User

**Function:** `handle_new_user()`

**Purpose:** Automatically creates profile when user signs up

**Trigger:**
```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
```

**Behavior:**
- Extracts email from `auth.users`
- Extracts full name from metadata
- Sets role from metadata (defaults to 'team_member')
- Creates profile record
- Never fails user creation (graceful error handling)

#### Handle Email Update

**Function:** `handle_user_email_update()`

**Purpose:** Syncs email changes from `auth.users` to `profiles`

**Trigger:**
```sql
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION handle_user_email_update();
```

---

## Row Level Security

### RLS Overview

**Enabled on:** All application tables (20+ tables)

**Strategy:**
- **Admins**: Full CRUD access
- **Team Members**: Read/write on assigned projects
- **Clients**: Read-only on their projects, can create tickets

### Helper Functions

#### is_admin()
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

#### is_client()
```sql
CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'client'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

#### is_assigned_to_project(project_uuid)
```sql
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
```

#### is_user_in_team(team_uuid)
```sql
CREATE OR REPLACE FUNCTION is_user_in_team(team_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM team_members tm
        JOIN profiles p ON p.id = tm.profile_id
        WHERE tm.team_id = team_uuid 
        AND p.user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**Note:** Uses `SECURITY DEFINER` to bypass RLS and prevent infinite recursion.

### RLS Policy Examples

#### Projects Policies

```sql
-- Admins have full access
CREATE POLICY "Admins have full access to projects"
    ON projects FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Team members can read assigned projects
CREATE POLICY "Team members can read assigned projects"
    ON projects FOR SELECT
    USING (
        is_admin()
        OR is_assigned_to_project(projects.id)
    );

-- Clients can read their projects
CREATE POLICY "Clients can read their projects"
    ON projects FOR SELECT
    USING (
        is_client() 
        AND is_project_client(projects.id)
    );
```

#### Team Members Policies

```sql
-- Users can read their team memberships
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
```

---

## Data Flow & Queries

### Common Query Patterns

#### Get User's Projects

```sql
-- For team members: Projects they're assigned to
SELECT DISTINCT p.*
FROM projects p
JOIN project_teams pt ON pt.project_id = p.id
JOIN team_members tm ON tm.team_id = pt.team_id
JOIN profiles pr ON pr.id = tm.profile_id
WHERE pr.user_id = auth.uid()
  AND p.status = 'active'
ORDER BY p.created_at DESC;
```

#### Get Project with Related Data

```sql
SELECT 
    p.*,
    json_agg(DISTINCT jsonb_build_object(
        'id', t.id,
        'name', t.name
    )) FILTER (WHERE t.id IS NOT NULL) as teams,
    json_agg(DISTINCT jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'is_completed', d.is_completed
    )) FILTER (WHERE d.id IS NOT NULL) as deliverables
FROM projects p
LEFT JOIN project_teams pt ON pt.project_id = p.id
LEFT JOIN teams t ON t.id = pt.team_id
LEFT JOIN deliverables d ON d.project_id = p.id
WHERE p.id = $1
GROUP BY p.id;
```

#### Get Tasks with Dependencies

```sql
SELECT 
    t.*,
    json_agg(jsonb_build_object(
        'id', td.depends_on_task_id,
        'title', dt.title
    )) FILTER (WHERE td.depends_on_task_id IS NOT NULL) as dependencies
FROM tasks t
LEFT JOIN task_dependencies td ON td.task_id = t.id
LEFT JOIN tasks dt ON dt.id = td.depends_on_task_id
WHERE t.project_id = $1
GROUP BY t.id;
```

#### Calculate Project Budget

```sql
SELECT 
    p.id,
    p.budget_allocated,
    p.budget_spent,
    COALESCE(SUM(be.amount), 0) as total_expenses,
    COALESCE(SUM(
        CASE 
            WHEN ra.end_date IS NULL THEN 
                EXTRACT(MONTH FROM AGE(CURRENT_DATE, ra.start_date)) * ra.monthly_rate
            ELSE 
                EXTRACT(MONTH FROM AGE(ra.end_date, ra.start_date)) * ra.monthly_rate
        END
    ), 0) as accrued_resources,
    (p.budget_spent + COALESCE(SUM(be.amount), 0) + COALESCE(SUM(...), 0)) as total_spend
FROM projects p
LEFT JOIN budget_expenses be ON be.project_id = p.id
LEFT JOIN resource_allocations ra ON ra.project_id = p.id
WHERE p.id = $1
GROUP BY p.id;
```

### Data Flow Examples

#### Creating a Project

1. **Insert Project**
   ```sql
   INSERT INTO projects (name, description, start_date, end_date, budget_allocated, client_id, created_by)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   RETURNING id;
   ```

2. **Assign Teams** (if provided)
   ```sql
   INSERT INTO project_teams (project_id, team_id)
   VALUES ($1, $2), ($1, $3), ...;
   ```

3. **Create Deliverables** (if provided)
   ```sql
   INSERT INTO deliverables (project_id, title, description, due_date)
   VALUES ($1, $2, $3, $4), ...;
   ```

#### Updating Task Status

1. **Validate Workflow** (application level)
2. **Check Dependencies** (if marking as done)
3. **Update Task**
   ```sql
   UPDATE tasks
   SET status = $1,
       updated_at = NOW(),
       completed_at = CASE WHEN $1 = 'done' THEN NOW() ELSE completed_at END
   WHERE id = $2;
   ```

#### Archiving a Project

```sql
UPDATE projects
SET status = 'archived',
    archived_at = NOW(),
    updated_at = NOW()
WHERE id = $1;
```

---

## Migration Strategy

### Initial Setup

1. **Run Schema**
   ```bash
   psql -f supabase/schema.sql
   ```

2. **Enable RLS**
   ```bash
   psql -f supabase/rls_policies.sql
   ```

3. **Set Up Triggers**
   ```bash
   psql -f supabase/auth_triggers.sql
   ```

4. **Fix RLS Recursion** (if needed)
   ```bash
   psql -f supabase/fix_team_members_rls.sql
   ```

### Adding New Tables

**Migration Template:**
```sql
-- Migration: Add invoices table
-- Date: 2025-01-16
-- Author: Development Team

BEGIN;

-- Create table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Admins have full access to invoices"
    ON invoices FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Team members can read project invoices"
    ON invoices FOR SELECT
    USING (
        is_admin()
        OR is_assigned_to_project(invoices.project_id)
    );

-- Add trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

### Modifying Existing Tables

**Add Column:**
```sql
ALTER TABLE projects
ADD COLUMN new_field TEXT;
```

**Modify Column:**
```sql
ALTER TABLE projects
ALTER COLUMN description TYPE TEXT;
```

**Add Constraint:**
```sql
ALTER TABLE projects
ADD CONSTRAINT new_constraint CHECK (condition);
```

**Drop Column:**
```sql
ALTER TABLE projects
DROP COLUMN old_field;
```

### Version Control

- **Migration Files**: Numbered sequentially
- **Format**: `YYYYMMDD_HHMMSS_description.sql`
- **Example**: `20250116_143000_add_invoices_table.sql`

---

## Performance Optimization

### Query Optimization

#### Use Indexes
```sql
-- Good: Uses index on project_id
SELECT * FROM tasks WHERE project_id = $1;

-- Bad: Full table scan
SELECT * FROM tasks WHERE LOWER(title) LIKE '%search%';
```

#### Limit Results
```sql
-- Good: Limit results
SELECT * FROM projects 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 20;

-- Bad: Fetch all records
SELECT * FROM projects WHERE status = 'active';
```

#### Use EXPLAIN ANALYZE
```sql
EXPLAIN ANALYZE
SELECT * FROM projects
WHERE status = 'active'
  AND start_date <= CURRENT_DATE;
```

### Index Maintenance

#### Check Index Usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

#### Rebuild Indexes
```sql
REINDEX TABLE projects;
REINDEX INDEX idx_projects_status;
```

### Connection Pooling

Supabase handles connection pooling automatically. For custom setups:

```typescript
// Use connection pooling
const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Backup & Recovery

### Supabase Backups

Supabase provides automatic daily backups:
- **Retention**: 7 days (free tier), 30 days (paid)
- **Point-in-time recovery**: Available on paid plans
- **Manual backups**: Via Supabase dashboard

### Manual Backup

```bash
# Backup entire database
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Backup specific schema
pg_dump -h db.xxx.supabase.co -U postgres -d postgres -n public > backup.sql

# Restore
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

### Data Export

```sql
-- Export projects to CSV
COPY (
    SELECT id, name, status, budget_allocated, created_at
    FROM projects
) TO '/tmp/projects.csv' WITH CSV HEADER;
```

---

## Best Practices

### Naming Conventions

- **Tables**: Plural, snake_case (`projects`, `team_members`)
- **Columns**: snake_case (`created_at`, `user_id`)
- **Indexes**: `idx_<table>_<column(s)>`
- **Constraints**: Descriptive names (`valid_email`, `no_self_dependency`)
- **Functions**: snake_case (`is_admin`, `update_updated_at_column`)

### Data Types

- **IDs**: `UUID` (primary keys)
- **Timestamps**: `TIMESTAMPTZ` (timezone-aware)
- **Dates**: `DATE` (no time component)
- **Money**: `DECIMAL(15, 2)` (precision for currency)
- **Text**: `TEXT` (unlimited length)
- **Booleans**: `BOOLEAN`

### Foreign Keys

- **Always use foreign keys** for referential integrity
- **Choose appropriate CASCADE behavior**
- **Index all foreign keys** for join performance

### Constraints

- **Use CHECK constraints** for business rules
- **Use UNIQUE constraints** to prevent duplicates
- **Use NOT NULL** for required fields

### Indexes

- **Index foreign keys** (automatic consideration)
- **Index frequently queried columns**
- **Use composite indexes** for multi-column queries
- **Don't over-index** (writes become slower)

### RLS Policies

- **Enable RLS on all tables**
- **Use SECURITY DEFINER functions** for complex checks
- **Test policies thoroughly** with different user roles
- **Avoid infinite recursion** in policy functions

### Triggers

- **Keep triggers simple** and fast
- **Use SECURITY DEFINER** when needed
- **Handle errors gracefully**
- **Document trigger behavior**

---

## Database Maintenance

### Regular Tasks

#### Weekly
- Review slow queries
- Check index usage
- Monitor table sizes

#### Monthly
- Analyze table statistics
- Rebuild unused indexes
- Review RLS policies

#### Quarterly
- Review and optimize queries
- Archive old data (if needed)
- Update documentation

### Monitoring Queries

#### Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Slow Queries
```sql
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### Connection Stats
```sql
SELECT 
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit
FROM pg_stat_database
WHERE datname = 'postgres';
```

---

## Troubleshooting

### Common Issues

#### RLS Policy Errors

**Problem:** "new row violates row-level security policy"

**Solution:**
1. Check user's role in `profiles` table
2. Verify RLS policies are correct
3. Ensure helper functions use `SECURITY DEFINER`

#### Foreign Key Violations

**Problem:** "violates foreign key constraint"

**Solution:**
1. Ensure parent record exists
2. Check CASCADE behavior
3. Verify data integrity

#### Index Not Used

**Problem:** Query is slow despite index

**Solution:**
1. Run `ANALYZE` on table
2. Check query with `EXPLAIN ANALYZE`
3. Verify index is appropriate for query pattern

#### Trigger Errors

**Problem:** Trigger fails silently

**Solution:**
1. Check trigger function for errors
2. Review logs in Supabase dashboard
3. Test trigger function manually

---

## Quick Reference

### Common SQL Queries

```sql
-- Get all active projects
SELECT * FROM projects WHERE status = 'active';

-- Get project with teams
SELECT p.*, json_agg(t.*) as teams
FROM projects p
LEFT JOIN project_teams pt ON pt.project_id = p.id
LEFT JOIN teams t ON t.id = pt.team_id
WHERE p.id = $1
GROUP BY p.id;

-- Get tasks for project
SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC;

-- Get project budget summary
SELECT 
    budget_allocated,
    budget_spent,
    (SELECT SUM(amount) FROM budget_expenses WHERE project_id = $1) as expenses
FROM projects
WHERE id = $1;
```

### Useful Commands

```sql
-- Check table structure
\d+ table_name

-- List all tables
\dt

-- List all indexes
\di

-- List all functions
\df

-- List all triggers
SELECT * FROM pg_trigger WHERE tgname LIKE '%trigger_name%';

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** Database Team

For questions about the database, refer to:
- This documentation
- `supabase/schema.sql` for complete schema
- `supabase/rls_policies.sql` for RLS policies
- `supabase/auth_triggers.sql` for triggers
- Supabase Dashboard for live database inspection
