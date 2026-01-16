# Supabase Backend Integration

Complete Supabase backend implementation for Nexus PM project management application.

## Overview

This directory contains all Supabase-related files including:
- Database schema (PostgreSQL)
- Row Level Security (RLS) policies
- Authentication triggers
- Setup documentation

## File Structure

```
supabase/
├── schema.sql           # Complete database schema
├── rls_policies.sql     # Row Level Security policies
├── auth_triggers.sql    # Authentication triggers
├── SETUP.md             # Step-by-step setup guide
└── README.md           # This file
```

## Architecture

### Database Schema

The schema follows normalized database design principles:

- **Profiles**: Extends Supabase auth.users with application data
- **Clients**: Client organizations/individuals
- **Teams**: Collections of team members
- **Projects**: Top-level project entities
- **Tasks**: Work items with dependencies
- **Tickets**: Unified ticketing system
- **Milestones**: Project milestones
- **Deliverables**: Expected project outputs

### Authentication & Authorization

- **Supabase Auth**: Handles user authentication
- **Profiles Table**: Stores user roles (admin, team_member, client)
- **RLS Policies**: Enforce access control at database level
- **Triggers**: Auto-create profiles on signup

### Access Control

**Admins:**
- Full access to all data
- Can create/update/delete anything
- Can change user roles

**Team Members:**
- Read/write access to assigned projects
- Can create tasks, update statuses
- Can manage teams they belong to

**Clients:**
- Read-only access to their projects
- Can create tickets/inquiries
- Can view progress and timelines

## Quick Start

1. **Run Schema**: Execute `schema.sql` in Supabase SQL Editor
2. **Enable RLS**: Execute `rls_policies.sql` in Supabase SQL Editor
3. **Set Up Auth**: Execute `auth_triggers.sql` in Supabase SQL Editor
4. **Create Admin**: Follow instructions in `SETUP.md`
5. **Use Services**: Import from `lib/supabase/services/`

## Usage Examples

### Authentication

```typescript
import { signUp, signIn, signOut } from './lib/supabase/auth';

// Sign up
await signUp('user@example.com', 'password', 'John Doe', 'team_member');

// Sign in
await signIn('user@example.com', 'password');

// Sign out
await signOut();
```

### Projects

```typescript
import { getProjects, createProject } from './lib/supabase/services/projects';

// Get all projects
const projects = await getProjects();

// Get projects by status
const activeProjects = await getProjects({ status: 'active' });

// Create project
const project = await createProject({
  name: 'New Project',
  description: 'Project description',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  budgetAllocated: 100000,
  currency: 'USD',
  clientId: 'client-id',
});
```

### Tasks

```typescript
import { getTasksByProject, createTask } from './lib/supabase/services/tasks';

// Get tasks for a project
const tasks = await getTasksByProject('project-id');

// Create task
const task = await createTask({
  projectId: 'project-id',
  title: 'New Task',
  description: 'Task description',
  priority: 'high',
  startDate: '2024-01-01',
  endDate: '2024-01-15',
  dependencies: ['task-id-1'],
});
```

### Teams

```typescript
import { getTeams, createTeam } from './lib/supabase/services/teams';

// Get all teams
const teams = await getTeams();

// Create team
const team = await createTeam({
  name: 'Frontend Team',
  description: 'Frontend development team',
  members: [
    { name: 'Alice', email: 'alice@example.com', role: 'Developer' },
    { name: 'Bob', email: 'bob@example.com', role: 'Designer' },
  ],
});
```

### Tickets

```typescript
import { getTickets, createTicket } from './lib/supabase/services/tickets';

// Get tickets for a project
const tickets = await getTickets({ projectId: 'project-id' });

// Create ticket (client submission)
const ticket = await createTicket({
  type: 'inquiry',
  title: 'Question about project',
  description: 'I have a question...',
  priority: 'medium',
  projectId: 'project-id',
  reporterName: 'Client Name',
  reporterEmail: 'client@example.com',
});
```

## Integration with Frontend

### Replace Mock Data

Instead of using `mockData.ts`, use Supabase services:

```typescript
// Before (mock data)
import { mockProjects } from './mockData';
const [projects, setProjects] = useState<Project[]>(mockProjects);

// After (Supabase)
import { getProjects } from './lib/supabase/services/projects';
const [projects, setProjects] = useState<Project[]>([]);

useEffect(() => {
  getProjects().then(setProjects).catch(console.error);
}, []);
```

### Handle Authentication State

```typescript
import { onAuthStateChange, getSession } from './lib/supabase/auth';

useEffect(() => {
  // Get initial session
  getSession().then(session => {
    if (session) {
      // User is authenticated
      setUser(session.user);
    }
  });

  // Listen for auth changes
  const { data: { subscription } } = onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      setUser(session?.user ?? null);
    } else if (event === 'SIGNED_OUT') {
      setUser(null);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

## Security Considerations

1. **RLS Policies**: All data access is controlled by RLS policies
2. **Role-Based Access**: User roles determine what they can access
3. **Input Validation**: Validate all inputs before database operations
4. **Error Handling**: Never expose sensitive error details to clients
5. **API Keys**: Never expose service_role key in client code

## Performance Optimization

1. **Indexes**: All foreign keys and commonly queried fields are indexed
2. **Selective Queries**: Use `.select()` to fetch only needed fields
3. **Pagination**: Implement pagination for large datasets
4. **Caching**: Consider caching frequently accessed data

## Testing

Test your setup:

1. **Authentication**: Sign up, sign in, sign out
2. **Projects**: Create, read, update, archive
3. **Tasks**: Create with dependencies, update status
4. **Teams**: Create, add members, assign to projects
5. **Tickets**: Create as client, update as team member

## Troubleshooting

See `SETUP.md` for detailed troubleshooting steps.

Common issues:
- RLS policies blocking access → Check user role and policies
- Foreign key violations → Ensure parent records exist
- Authentication not working → Check triggers and email settings

## Next Steps

1. Complete frontend integration
2. Add real-time subscriptions if needed
3. Set up database backups
4. Configure email templates
5. Add monitoring and logging

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
