# Nexus PM - Client Documentation

**Version:** 1.0  
**Last Updated:** January 2025  
**Document Type:** User & Technical Guide

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Non-Technical Overview](#non-technical-overview)
3. [User Guide](#user-guide)
4. [Technical Documentation](#technical-documentation)
5. [System Architecture](#system-architecture)
6. [API Reference](#api-reference)
7. [Deployment Guide](#deployment-guide)
8. [Support & Maintenance](#support--maintenance)

---

## Executive Summary

**Nexus PM** is an enterprise-grade project management platform designed to streamline project delivery, team collaboration, and client communication. Built with modern web technologies and best practices, Nexus PM provides a comprehensive solution for managing complex projects from inception to completion.

### Key Value Propositions

- **Unified Project Management**: Single platform for projects, tasks, teams, and client communication
- **Real-Time Collaboration**: Live updates and team coordination tools
- **Financial Transparency**: Complete budget tracking and expense management
- **Client Portal**: Dedicated space for clients to track progress and submit requests
- **Scalable Architecture**: Built to grow with your organization
- **Enterprise Security**: Role-based access control and data protection

### Target Users

- **Project Managers**: Full access to manage projects, teams, and resources
- **Team Members**: Access to assigned projects and tasks
- **Clients**: Read-only access to their projects with ticket submission capability
- **Administrators**: Complete system management and configuration

---

## Non-Technical Overview

### What is Nexus PM?

Nexus PM is a web-based project management system that helps organizations plan, execute, and deliver projects successfully. Think of it as a digital command center where:

- **Projects** are organized with clear timelines and budgets
- **Tasks** are tracked from start to finish with visual boards and charts
- **Teams** collaborate effectively with clear assignments
- **Clients** stay informed about progress without overwhelming detail

### Core Features

#### 1. Project Management
- Create and manage multiple projects simultaneously
- Set project timelines with start and end dates
- Track budgets with allocated amounts and actual spending
- Define deliverables and track completion
- Archive completed projects for historical reference

#### 2. Task Management
- **List View**: See all tasks in a simple list format
- **Kanban Board**: Visualize tasks as cards moving through stages
- **Gantt Chart**: View project timeline with task dependencies
- Set task priorities (Low, Medium, High, Urgent)
- Link tasks together (dependencies)
- Assign tasks to teams or individuals

#### 3. Team Collaboration
- Create teams and assign members
- Assign teams to projects
- Track team workload and assignments
- Manage team roles and responsibilities

#### 4. Client Portal
- Clients can view their projects in read-only mode
- See project progress, timelines, and budgets
- View deliverables and milestones
- Submit tickets for inquiries, issues, or feature requests
- Track ticket status and responses

#### 5. Financial Tracking
- Set project budgets
- Track expenses by category
- Monitor resource allocation costs
- View budget utilization and remaining funds
- Generate financial reports

#### 6. Ticket System
- Submit inquiries, issues, or feature requests
- Track ticket status and resolution
- Link tickets to projects and tasks
- Assign tickets to teams for resolution

### User Roles & Permissions

#### Administrator
- Full access to all features
- Create and manage users
- Configure system settings
- Archive and delete projects
- View all projects and data

#### Team Member
- View and edit assigned projects
- Create and update tasks in assigned projects
- View team information
- Create tickets
- Limited access to financial data

#### Client
- View own projects (read-only)
- See project progress and timelines
- View deliverables and milestones
- Submit tickets
- Cannot modify project data

### Getting Started

1. **Access the Application**: Navigate to the provided URL
2. **Login**: Use your provided credentials
3. **Explore Dashboard**: View overview of projects and tasks
4. **Create Your First Project**: Use the "Create Project" button
5. **Add Tasks**: Break down projects into manageable tasks
6. **Assign Teams**: Assign teams to work on projects
7. **Track Progress**: Monitor progress through various views

---

## User Guide

### Dashboard

The dashboard provides an at-a-glance view of your projects and tasks.

**Key Metrics:**
- Active Projects count
- Pending Tasks count
- Completed Tasks count
- Urgent Tickets count

**Visualizations:**
- Budget allocation vs. expenditure chart
- Recent projects with progress bars

### Creating a Project

1. Click **"Create Project"** button (available in Dashboard or Projects page)
2. Fill in the required fields:
   - **Project Name**: Descriptive name for your project
   - **Description**: Detailed description of the project
   - **Start Date**: When the project begins
   - **End Date**: When the project should be completed
   - **Budget Allocated**: Total budget for the project
   - **Client ID**: UUID of the client (enter manually)
   - **Assign Teams**: Select teams to work on the project (optional)
3. Click **"Create Project"** to save

### Managing Tasks

#### Viewing Tasks
- **List View**: See all tasks in a table format
- **Kanban Board**: Drag and drop tasks between status columns
- **Gantt Chart**: View timeline with dependencies

#### Creating Tasks
1. Navigate to a project
2. Click **"Add Task"** button
3. Fill in task details:
   - Title and description
   - Priority level
   - Start and end dates
   - Assign to team or individual
4. Save the task

#### Updating Task Status
- Drag tasks between columns in Kanban view
- Or click on task and change status manually
- System validates workflow transitions automatically

### Team Management

#### Creating a Team
1. Navigate to **"Team Members"** section
2. Click **"Create Team"**
3. Enter team name and description
4. Add team members by email
5. Save the team

#### Assigning Teams to Projects
- When creating/editing a project, select teams from the dropdown
- Teams can be assigned to multiple projects
- Team members automatically get access to assigned projects

### Client Portal

Clients can access their portal to:
- View project progress
- See timelines and milestones
- Check budget utilization
- Submit tickets for support or requests

**Submitting a Ticket:**
1. Navigate to Tickets section
2. Click **"Create Ticket"**
3. Select ticket type (Inquiry, Issue, Feature Request)
4. Enter title and description
5. Submit the ticket

### Financial Management

#### Budget Tracking
- View allocated budget vs. actual spending
- Track expenses by category
- Monitor resource allocation costs
- See remaining budget

#### Adding Expenses
1. Navigate to project's **"Financials"** tab
2. Click **"Add Expense"**
3. Enter expense details:
   - Category
   - Amount
   - Date
   - Description
4. Save the expense

---

## Technical Documentation

### Technology Stack

#### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

#### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **API**: Supabase REST API
- **Real-time**: Supabase Realtime (optional)

#### Infrastructure
- **Hosting**: Vercel (recommended)
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network

### System Requirements

#### Development
- Node.js 18+ 
- npm 9+ or yarn 1.22+
- Modern web browser (Chrome, Firefox, Safari, Edge)

#### Production
- Node.js 18+ runtime
- PostgreSQL 14+ (via Supabase)
- HTTPS enabled domain
- Modern browser support

### Installation & Setup

#### Prerequisites
1. Node.js installed
2. Supabase account and project
3. Git repository access

#### Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd nexus-pm---elite-project-management

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev

# Open browser to http://localhost:5173
```

#### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Database Setup

1. **Create Supabase Project**: Sign up at supabase.com
2. **Run Schema Script**: Execute `supabase/schema.sql` in SQL Editor
3. **Set Up RLS Policies**: Execute `supabase/rls_policies.sql`
4. **Configure Auth Triggers**: Execute `supabase/auth_triggers.sql`
5. **Fix RLS Recursion**: Execute `supabase/fix_team_members_rls.sql` (if needed)

See `supabase/SETUP.md` for detailed setup instructions.

### Build & Deployment

#### Build for Production

```bash
# Build the application
npm run build

# Preview production build locally
npm run preview
```

#### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to configure
```

#### Environment Configuration

Set these environment variables in your hosting platform:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

---

## System Architecture

### Architecture Overview

Nexus PM follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────────────────────────┐
│         UI Layer (React)            │
│    Components, Views, Layouts       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Business Logic (Services)        │
│  ProjectService, TaskService, etc.  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Domain Models (Core)           │
│   Project, Task, Team, Ticket       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Data Access (Supabase Services)   │
│   CRUD operations, queries          │
└─────────────────────────────────────┘
```

### Key Components

#### Frontend Architecture

- **Components**: React functional components with hooks
- **State Management**: React useState/useEffect
- **Routing**: React Router (if implemented)
- **API Integration**: Supabase client library

#### Backend Architecture

- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row Level Security (RLS) policies
- **API**: Supabase auto-generated REST API

### Database Schema

#### Core Tables

- **profiles**: User profiles extending auth.users
- **clients**: Client organizations
- **teams**: Team collections
- **team_members**: Team membership junction table
- **projects**: Project entities
- **tasks**: Task entities
- **task_groups**: Task grouping/epics
- **task_dependencies**: Task dependency relationships
- **tickets**: Unified ticketing system
- **deliverables**: Expected project outputs
- **milestones**: Project milestones
- **budget_expenses**: Manual expenses
- **resource_allocations**: Team billing rates

#### Relationships

- Projects → Clients (many-to-one)
- Projects → Teams (many-to-many via project_teams)
- Tasks → Projects (many-to-one)
- Tasks → Teams (many-to-one)
- Tasks → Task Dependencies (many-to-many)
- Teams → Team Members (many-to-many)

### Security Architecture

#### Authentication
- Email/password authentication via Supabase Auth
- JWT token-based sessions
- Automatic session refresh
- Password reset functionality

#### Authorization
- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Access Control (RBAC)**: Admin, Team Member, Client roles
- **Project-Based Access**: Team members see only assigned projects
- **Client Isolation**: Clients see only their own projects

#### Data Protection
- HTTPS enforced
- SQL injection prevention (parameterized queries)
- XSS protection (React's built-in escaping)
- CSRF protection (Supabase handles)

---

## API Reference

### Authentication Endpoints

#### Sign Up
```typescript
POST /auth/v1/signup
Body: {
  email: string,
  password: string,
  options: {
    data: {
      full_name?: string,
      role?: 'admin' | 'team_member' | 'client'
    }
  }
}
```

#### Sign In
```typescript
POST /auth/v1/token?grant_type=password
Body: {
  email: string,
  password: string
}
```

#### Sign Out
```typescript
POST /auth/v1/logout
Headers: {
  Authorization: Bearer <token>
}
```

### Projects API

#### Get All Projects
```typescript
GET /rest/v1/projects?select=*
Headers: {
  Authorization: Bearer <token>,
  apikey: <anon-key>
}
```

#### Get Project by ID
```typescript
GET /rest/v1/projects?id=eq.<project-id>&select=*
```

#### Create Project
```typescript
POST /rest/v1/projects
Body: {
  name: string,
  description: string,
  start_date: string (ISO date),
  end_date: string (ISO date),
  budget_allocated: number,
  currency: 'USD' | 'EUR' | 'GBP' | ...,
  client_id: string (UUID),
  status: 'draft' | 'active' | 'archived'
}
```

#### Update Project
```typescript
PATCH /rest/v1/projects?id=eq.<project-id>
Body: {
  // Partial update fields
}
```

#### Archive Project
```typescript
PATCH /rest/v1/projects?id=eq.<project-id>
Body: {
  status: 'archived',
  archived_at: string (ISO timestamp)
}
```

### Tasks API

#### Get Tasks by Project
```typescript
GET /rest/v1/tasks?project_id=eq.<project-id>&select=*
```

#### Create Task
```typescript
POST /rest/v1/tasks
Body: {
  project_id: string (UUID),
  title: string,
  description: string,
  status: 'todo' | 'in_progress' | 'review' | 'blocked' | 'done',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  start_date: string (ISO date),
  end_date: string (ISO date),
  assignee_team_id?: string (UUID)
}
```

### Teams API

#### Get All Teams
```typescript
GET /rest/v1/teams?select=*
```

#### Create Team
```typescript
POST /rest/v1/teams
Body: {
  name: string,
  description?: string
}
```

### Tickets API

#### Get Tickets
```typescript
GET /rest/v1/tickets?select=*
```

#### Create Ticket
```typescript
POST /rest/v1/tickets
Body: {
  type: 'inquiry' | 'issue' | 'feature_request' | 'backlog_item',
  title: string,
  description: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  project_id?: string (UUID),
  reporter_name: string,
  reporter_email: string
}
```

### Error Responses

All endpoints return standard HTTP status codes:

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

Error response format:
```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## Deployment Guide

### Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] RLS policies applied
- [ ] Auth triggers configured
- [ ] Test data seeded (optional)
- [ ] Admin user created
- [ ] SSL certificate configured
- [ ] Domain configured

### Deployment Steps

#### 1. Database Setup
```sql
-- Run in Supabase SQL Editor
\i supabase/schema.sql
\i supabase/rls_policies.sql
\i supabase/auth_triggers.sql
\i supabase/fix_team_members_rls.sql
```

#### 2. Environment Configuration
Set environment variables in hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

#### 3. Build Application
```bash
npm run build
```

#### 4. Deploy to Hosting
- **Vercel**: Connect GitHub repo, auto-deploy
- **Netlify**: Connect GitHub repo, set build command
- **Custom**: Upload `dist/` folder to web server

#### 5. Post-Deployment
- Verify application loads
- Test authentication
- Create admin user
- Test project creation
- Verify RLS policies working

### Monitoring & Maintenance

#### Health Checks
- Application uptime monitoring
- Database connection monitoring
- API response time monitoring
- Error rate tracking

#### Backup Strategy
- **Database**: Supabase automatic backups (daily)
- **Code**: Git repository (version control)
- **Configuration**: Environment variables documented

#### Update Process
1. Update code in development branch
2. Test thoroughly
3. Merge to main branch
4. Automatic deployment triggers
5. Verify in production

---

## Support & Maintenance

### Getting Help

#### For End Users
- Check this documentation first
- Contact your system administrator
- Submit a ticket through the application

#### For Administrators
- Review technical documentation
- Check Supabase dashboard for errors
- Review application logs
- Contact development team

### Common Issues & Solutions

#### Authentication Issues
- **Problem**: Cannot log in
- **Solution**: Verify credentials, check Supabase Auth settings, ensure user exists

#### Permission Errors
- **Problem**: Cannot access projects
- **Solution**: Verify RLS policies, check user role, ensure team assignments

#### Data Not Loading
- **Problem**: Projects/tasks not appearing
- **Solution**: Check RLS policies, verify database connection, check browser console

### Maintenance Windows

- **Scheduled Maintenance**: Typically weekends, 2-4 hour windows
- **Emergency Maintenance**: As needed, with notification
- **Updates**: Usually deployed automatically, minimal downtime

### Version History

- **v1.0** (January 2025): Initial release
  - Core project management features
  - Task management with multiple views
  - Team collaboration
  - Client portal
  - Financial tracking
  - Ticket system

---

## Appendix

### Glossary

- **Project**: Top-level organizational unit containing tasks, teams, and deliverables
- **Task**: Individual work item within a project
- **Team**: Collection of team members assigned to projects
- **Ticket**: Client inquiry, issue report, or feature request
- **Deliverable**: Expected output from a project
- **Milestone**: Significant point in project timeline
- **RLS**: Row Level Security - database-level access control
- **UUID**: Universally Unique Identifier - unique ID format

### Acronyms

- **PM**: Project Management
- **RLS**: Row Level Security
- **RBAC**: Role-Based Access Control
- **API**: Application Programming Interface
- **JWT**: JSON Web Token
- **HTTPS**: Hypertext Transfer Protocol Secure
- **SQL**: Structured Query Language
- **CRUD**: Create, Read, Update, Delete

### References

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** Development Team

For questions or updates to this documentation, please contact your system administrator.
