# Nexus PM - Technical Code Documentation

**Version:** 1.0  
**Last Updated:** January 2025  
**Audience:** Developers, Technical Leads, Code Contributors

---

## Table of Contents

1. [Codebase Overview](#codebase-overview)
2. [Project Structure](#project-structure)
3. [Core Patterns & Conventions](#core-patterns--conventions)
4. [Domain Models](#domain-models)
5. [Services Layer](#services-layer)
6. [Data Access Layer](#data-access-layer)
7. [UI Components](#ui-components)
8. [Supabase Integration](#supabase-integration)
9. [State Management](#state-management)
10. [Error Handling](#error-handling)
11. [TypeScript Patterns](#typescript-patterns)
12. [Testing Guide](#testing-guide)
13. [Extending the Codebase](#extending-the-codebase)
14. [Code Examples](#code-examples)
15. [Performance Optimization](#performance-optimization)
16. [Debugging Guide](#debugging-guide)

---

## Codebase Overview

### Technology Stack

```typescript
// Frontend
- React 18+ (Functional Components + Hooks)
- TypeScript 5+ (Strict Mode)
- Vite (Build Tool)
- Tailwind CSS (Styling)
- Recharts (Data Visualization)

// Backend Integration
- Supabase (PostgreSQL + Auth + Real-time)
- Row Level Security (RLS) for authorization
- JWT Authentication

// Development Tools
- ESLint (Code Quality)
- Prettier (Code Formatting)
- Git (Version Control)
```

### Architecture Pattern

Nexus PM follows **Clean Architecture** with clear layer separation:

```
components/          → UI Layer (React Components)
lib/supabase/       → Data Access Layer (Supabase Services)
core/services/      → Business Logic Layer (Domain Services)
core/models/        → Domain Models (Entities & Types)
```

**Dependency Flow:** Components → Services → Models (inward only)

---

## Project Structure

### Directory Layout

```
nexus-pm/
├── components/              # React UI components
│   ├── Dashboard.tsx       # Main dashboard view
│   ├── ProjectList.tsx     # Project listing
│   ├── ProjectDetail.tsx   # Project detail view
│   ├── CreateProjectModal.tsx
│   └── ...
│
├── core/                   # Core business logic
│   ├── models/             # Domain models
│   │   ├── Project.ts
│   │   ├── Task.ts
│   │   ├── Team.ts
│   │   ├── Ticket.ts
│   │   ├── Client.ts
│   │   └── index.ts
│   └── services/           # Business logic services
│       ├── ProjectService.ts
│       ├── TaskService.ts
│       ├── TeamService.ts
│       ├── TicketService.ts
│       └── index.ts
│
├── lib/                    # External library integrations
│   └── supabase/           # Supabase client & services
│       ├── client.ts        # Supabase client initialization
│       ├── auth.ts          # Authentication service
│       └── services/        # CRUD services
│           ├── projects.ts
│           ├── tasks.ts
│           ├── teams.ts
│           ├── tickets.ts
│           └── clients.ts
│
├── config/                 # Application configuration
│   └── AppConfig.ts        # Feature flags & settings
│
├── utils/                  # Utility functions
│   ├── currency.ts         # Currency formatting
│   └── financials.ts       # Financial calculations
│
├── data/                   # Data access (legacy, being migrated)
│   └── repositories/       # Repository pattern implementations
│
├── supabase/               # Database scripts
│   ├── schema.sql          # Database schema
│   ├── rls_policies.sql    # Row Level Security policies
│   └── auth_triggers.sql   # Authentication triggers
│
├── App.tsx                 # Main application component
├── index.tsx               # Application entry point
├── types.ts                # Type definitions (backward compat)
└── vite.config.ts          # Vite configuration
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `ProjectDetail.tsx`)
- **Services**: PascalCase with "Service" suffix (e.g., `ProjectService.ts`)
- **Models**: PascalCase (e.g., `Project.ts`)
- **Utilities**: camelCase (e.g., `currency.ts`)
- **Constants**: UPPER_SNAKE_CASE (if needed)

---

## Core Patterns & Conventions

### 1. Service Pattern

Services contain business logic and are stateless:

```typescript
// core/services/ProjectService.ts
export class ProjectService {
  /**
   * Create a new project with validation
   */
  createProject(payload: CreateProjectPayload): Project {
    // Validate dates
    if (!this.validateProjectDates(payload.startDate, payload.endDate)) {
      throw new Error('Start date must be before end date');
    }
    
    // Apply business rules
    return {
      id: this.generateId(),
      name: payload.name,
      status: ProjectStatus.ACTIVE,
      // ... other fields
    };
  }
  
  /**
   * Calculate total project spend
   */
  calculateTotalSpend(project: Project): number {
    const manualExpenses = project.budgetSpent || 0;
    const accruedResources = this.calculateAccruedResourceCosts(project);
    return manualExpenses + accruedResources;
  }
}
```

### 2. Repository Pattern (Legacy)

Repositories handle data persistence:

```typescript
// data/repositories/ProjectRepository.ts
export class ProjectRepository {
  private projects: Map<string, Project> = new Map();
  
  create(project: Project): Project {
    if (this.projects.has(project.id)) {
      throw new Error(`Project ${project.id} already exists`);
    }
    this.projects.set(project.id, project);
    return project;
  }
  
  getById(id: string): Project | undefined {
    return this.projects.get(id);
  }
  
  getAll(): Project[] {
    return Array.from(this.projects.values());
  }
}
```

### 3. Supabase Service Pattern (Current)

Direct Supabase integration for data access:

```typescript
// lib/supabase/services/projects.ts
import { supabase } from '../client';
import type { Project, CreateProjectPayload } from '../../../core/models/Project';

export async function getProjects(filters?: {
  status?: ProjectStatus;
  clientId?: string;
}): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      project_teams:project_teams(team:teams(*))
    `)
    .order('created_at', { ascending: false });
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  
  return (data || []).map(transformProject);
}
```

### 4. Component Pattern

React components follow functional component pattern:

```typescript
// components/ProjectList.tsx
import React from 'react';
import { Project, Task } from '../types';

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
  onProjectClick: (id: string) => void;
  onCreateProject?: () => void;
  currency: CurrencyCode;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  tasks,
  onProjectClick,
  onCreateProject,
  currency
}) => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Component JSX */}
    </div>
  );
};

export default ProjectList;
```

---

## Domain Models

### Project Model

```typescript
// core/models/Project.ts

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;        // ISO date string
  endDate: string;          // ISO date string
  budgetAllocated: number;
  budgetSpent: number;
  currency: CurrencyCode;
  expenses: BudgetExpense[];
  resourceAllocations: ResourceAllocation[];
  deliverables: Deliverable[];
  assignedTeamIds: string[];
  clientId: string;
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
  createdBy?: string;
  archivedAt?: string;
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budgetAllocated: number;
  currency: CurrencyCode;
  clientId: string;
  assignedTeamIds?: string[];
  deliverables?: Omit<Deliverable, 'id' | 'isCompleted'>[];
}

export type UpdateProjectPayload = Partial<Omit<Project, 'id' | 'createdAt' | 'createdBy'>>;
```

### Task Model

```typescript
// core/models/Task.ts

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  BLOCKED = 'blocked',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Task {
  id: string;
  projectId: string;
  groupId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeTeamId?: string;
  startDate: string;
  endDate: string;
  dueDate?: string;
  dependencies: string[];    // Array of task IDs
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy?: string;
}
```

### Team Model

```typescript
// core/models/Team.ts

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  profileId: string;
  name: string;
  email: string;
  role?: string;            // Role within the team
}
```

---

## Services Layer

### ProjectService Implementation

```typescript
// core/services/ProjectService.ts

export class ProjectService implements IProjectService {
  /**
   * Create a new project
   * 
   * @param payload Project creation data
   * @returns Created project entity
   * @throws Error if validation fails
   */
  createProject(payload: CreateProjectPayload): Project {
    // Validate dates
    if (!this.validateProjectDates(payload.startDate, payload.endDate)) {
      throw new Error('Start date must be before end date');
    }
    
    // Validate budget
    if (payload.budgetAllocated <= 0) {
      throw new Error('Budget must be greater than zero');
    }
    
    const now = new Date().toISOString();
    
    return {
      id: this.generateId(),
      name: payload.name,
      description: payload.description,
      status: ProjectStatus.ACTIVE,
      startDate: payload.startDate,
      endDate: payload.endDate,
      budgetAllocated: payload.budgetAllocated,
      budgetSpent: 0,
      currency: payload.currency,
      expenses: [],
      resourceAllocations: [],
      deliverables: payload.deliverables?.map(d => ({
        id: this.generateId(),
        title: d.title,
        description: d.description,
        isCompleted: false,
        dueDate: d.dueDate,
      })) || [],
      assignedTeamIds: payload.assignedTeamIds || [],
      clientId: payload.clientId,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  /**
   * Calculate total project spend
   * Includes manual expenses and accrued resource costs
   */
  calculateTotalSpend(project: Project): number {
    const manualExpenses = project.budgetSpent || 0;
    const accruedResources = this.calculateAccruedResourceCosts(project);
    return manualExpenses + accruedResources;
  }
  
  /**
   * Calculate accrued resource allocation costs
   * Based on monthly rates and elapsed time
   */
  private calculateAccruedResourceCosts(project: Project): number {
    if (!project.resourceAllocations || project.resourceAllocations.length === 0) {
      return 0;
    }
    
    const now = new Date();
    const projectStart = new Date(project.startDate);
    
    return project.resourceAllocations.reduce((total, allocation) => {
      const billingStart = new Date(
        new Date(allocation.startDate) > projectStart 
          ? allocation.startDate 
          : project.startDate
      );
      
      let billingEnd = now;
      if (allocation.endDate) {
        const allocationEnd = new Date(allocation.endDate);
        if (allocationEnd < billingEnd) {
          billingEnd = allocationEnd;
        }
      }
      const projectEnd = new Date(project.endDate);
      if (projectEnd < billingEnd) {
        billingEnd = projectEnd;
      }
      
      if (billingEnd <= billingStart) {
        return total;
      }
      
      // Calculate elapsed months (fractional)
      const years = billingEnd.getFullYear() - billingStart.getFullYear();
      const months = billingEnd.getMonth() - billingStart.getMonth();
      const days = billingEnd.getDate() - billingStart.getDate();
      const elapsedMonths = (years * 12) + months + (days / 30);
      
      return total + (elapsedMonths * allocation.monthlyRate);
    }, 0);
  }
  
  /**
   * Validate project dates
   */
  validateProjectDates(startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  }
  
  private generateId(): string {
    return `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
```

### TaskService Implementation

```typescript
// core/services/TaskService.ts

export class TaskService {
  /**
   * Update task status with workflow validation
   * 
   * @param task Task to update
   * @param newStatus New status
   * @param allTasks All tasks (for dependency validation)
   * @returns Updated task
   * @throws Error if transition is invalid
   */
  updateTaskStatus(
    task: Task,
    newStatus: TaskStatus,
    allTasks: Task[]
  ): Task {
    // Validate workflow transition
    if (!this.canTransitionStatus(task.status, newStatus)) {
      throw new Error(
        `Cannot transition from ${task.status} to ${newStatus}`
      );
    }
    
    // If marking as done, validate dependencies
    if (newStatus === TaskStatus.DONE) {
      const incompleteDeps = this.getIncompleteDependencies(task, allTasks);
      if (incompleteDeps.length > 0) {
        throw new Error(
          `Cannot mark task as done. Dependencies incomplete: ${incompleteDeps.join(', ')}`
        );
      }
    }
    
    return {
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      completedAt: newStatus === TaskStatus.DONE 
        ? new Date().toISOString() 
        : undefined,
    };
  }
  
  /**
   * Validate dependency graph (no circular dependencies)
   */
  validateDependencies(task: Task, allTasks: Task[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) {
        return true; // Cycle detected
      }
      
      if (visited.has(taskId)) {
        return false;
      }
      
      visited.add(taskId);
      recursionStack.add(taskId);
      
      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        for (const depId of task.dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(taskId);
      return false;
    };
    
    return !hasCycle(task.id);
  }
  
  /**
   * Check if status transition is allowed
   */
  canTransitionStatus(current: TaskStatus, next: TaskStatus): boolean {
    const config = getAppConfig();
    const transitions = config.taskWorkflow.transitions[current] || [];
    return transitions.includes(next);
  }
  
  private getIncompleteDependencies(task: Task, allTasks: Task[]): string[] {
    return task.dependencies.filter(depId => {
      const dep = allTasks.find(t => t.id === depId);
      return !dep || dep.status !== TaskStatus.DONE;
    });
  }
}
```

---

## Data Access Layer

### Supabase Client Setup

```typescript
// lib/supabase/client.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
}

/**
 * Get current user's profile
 */
export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error getting profile:', error);
    return null;
  }

  return data;
}
```

### Supabase Service Pattern

```typescript
// lib/supabase/services/projects.ts

import { supabase } from '../client';
import type { Project, CreateProjectPayload } from '../../../core/models/Project';

/**
 * Transform Supabase response to Project model
 */
function transformProject(data: any): Project {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    status: data.status,
    startDate: data.start_date,
    endDate: data.end_date,
    budgetAllocated: parseFloat(data.budget_allocated),
    budgetSpent: parseFloat(data.budget_spent || 0),
    currency: data.currency,
    expenses: (data.budget_expenses || []).map((e: any) => ({
      id: e.id,
      category: e.category,
      amount: parseFloat(e.amount),
      date: e.expense_date,
      description: e.description,
      createdBy: e.created_by,
      createdAt: e.created_at,
    })),
    resourceAllocations: (data.resource_allocations || []).map((ra: any) => ({
      id: ra.id,
      teamId: ra.team_id,
      monthlyRate: parseFloat(ra.monthly_rate),
      startDate: ra.start_date,
      endDate: ra.end_date,
      notes: ra.notes,
    })),
    deliverables: (data.deliverables || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      isCompleted: d.is_completed,
      dueDate: d.due_date,
      completedDate: d.completed_date,
    })),
    assignedTeamIds: (data.project_teams || []).map((pt: any) => pt.team_id),
    clientId: data.client_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
    archivedAt: data.archived_at,
  };
}

/**
 * Create a new project
 */
export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  // Get current user's profile
  const { data: { user } } = await supabase.auth.getUser();
  let createdBy = null;
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    createdBy = profile?.id;
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: payload.name,
      description: payload.description,
      start_date: payload.startDate,
      end_date: payload.endDate,
      budget_allocated: payload.budgetAllocated,
      budget_spent: 0,
      currency: payload.currency,
      client_id: payload.clientId,
      status: 'active',
      created_by: createdBy,
    })
    .select(`
      *,
      client:clients(*),
      project_teams:project_teams(team:teams(*)),
      deliverables:deliverables(*),
      resource_allocations:resource_allocations(team:teams(*)),
      budget_expenses:budget_expenses(*)
    `)
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  // Create deliverables if provided
  if (payload.deliverables && payload.deliverables.length > 0) {
    await supabase.from('deliverables').insert(
      payload.deliverables.map(d => ({
        project_id: data.id,
        title: d.title,
        description: d.description || null,
        due_date: d.dueDate || null,
        is_completed: false,
      }))
    );
  }

  // Assign teams if provided
  if (payload.assignedTeamIds && payload.assignedTeamIds.length > 0) {
    await supabase.from('project_teams').insert(
      payload.assignedTeamIds.map(teamId => ({
        project_id: data.id,
        team_id: teamId,
      }))
    );
  }

  // Refetch to get all related data
  const project = await getProjectById(data.id);
  if (!project) {
    throw new Error('Failed to fetch created project');
  }
  return project;
}
```

---

## UI Components

### Component Structure

```typescript
// components/ProjectList.tsx

import React from 'react';
import { Project, Task, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/currency';
import { getTotalProjectSpend } from '../utils/financials';

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
  onProjectClick: (id: string) => void;
  onCreateProject?: () => void;
  currency: CurrencyCode;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  tasks,
  onProjectClick,
  onCreateProject,
  currency
}) => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Projects</h2>
          <p className="text-slate-500">Managing {projects.length} active initiatives</p>
        </div>
        {onCreateProject && (
          <button
            onClick={onCreateProject}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            <Plus size={20} />
            Create Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(project => {
          const projectTasks = tasks.filter(t => t.projectId === project.id);
          const totalSpent = getTotalProjectSpend(project);
          
          return (
            <div
              key={project.id}
              onClick={() => onProjectClick(project.id)}
              className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-xl transition-all cursor-pointer"
            >
              {/* Project card content */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectList;
```

### Modal Component Pattern

```typescript
// components/CreateProjectModal.tsx

import React, { useState, useEffect } from 'react';
import { createProject, CreateProjectPayload } from '../lib/supabase/services/projects';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currency: CurrencyCode;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currency,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateProjectPayload>>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budgetAllocated: 0,
    currency: currency,
    clientId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (!formData.name || !formData.description || !formData.startDate || 
          !formData.endDate || !formData.clientId || !formData.budgetAllocated) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create project
      await createProject({
        name: formData.name!,
        description: formData.description!,
        startDate: formData.startDate!,
        endDate: formData.endDate!,
        budgetAllocated: formData.budgetAllocated!,
        currency: formData.currency || currency,
        clientId: formData.clientId!,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
        {/* Modal content */}
      </div>
    </div>
  );
};
```

---

## Supabase Integration

### Authentication Flow

```typescript
// lib/supabase/auth.ts

import { supabase } from './client';

/**
 * Sign up a new user
 */
export async function signUp(
  email: string,
  password: string,
  fullName?: string,
  role: 'admin' | 'team_member' | 'client' = 'team_member'
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role, // Used by trigger to set profile role
      },
    },
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign in existing user
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}
```

### Query Patterns

```typescript
// Basic query
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// Query with joins
const { data, error } = await supabase
  .from('projects')
  .select(`
    *,
    client:clients(*),
    project_teams:project_teams(
      team:teams(*)
    )
  `)
  .eq('id', projectId)
  .single();

// Filtering
let query = supabase.from('projects').select('*');

if (filters?.status) {
  query = query.eq('status', filters.status);
}

if (filters?.clientId) {
  query = query.eq('client_id', filters.clientId);
}

const { data, error } = await query;
```

---

## State Management

### App-Level State

```typescript
// App.tsx

const App: React.FC = () => {
  // State Management
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [projectsData, teamsData, ticketsData] = await Promise.all([
        getProjects(),
        getTeams(),
        getTickets(),
      ]);
      
      setProjects(projectsData);
      setTeams(teamsData);
      setTickets(ticketsData);
      
      // Load tasks for all projects
      const allTasks: Task[] = [];
      for (const project of projectsData) {
        const projectTasks = await getTasksByProject(project.id);
        allTasks.push(...projectTasks);
      }
      setTasks(allTasks);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Update project handler
  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const { updateProject: updateProjectService } = await import('./lib/supabase/services/projects');
      await updateProjectService(projectId, updates);
      
      // Reload projects
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);
    } catch (err: any) {
      console.error('Error updating project:', err);
      // Optimistic update
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    }
  };

  return (
    // Component JSX
  );
};
```

---

## Error Handling

### Service-Level Error Handling

```typescript
// lib/supabase/services/projects.ts

export async function getProjects(filters?: {
  status?: ProjectStatus;
  clientId?: string;
}): Promise<Project[]> {
  try {
    let query = supabase.from('projects').select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
    
    return (data || []).map(transformProject);
  } catch (err) {
    // Log error for debugging
    console.error('Error in getProjects:', err);
    // Re-throw for component to handle
    throw err;
  }
}
```

### Component-Level Error Handling

```typescript
// components/CreateProjectModal.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // Validation
    if (!formData.name) {
      setError('Project name is required');
      setLoading(false);
      return;
    }

    // API call
    await createProject({
      name: formData.name!,
      // ... other fields
    });

    onSuccess();
    onClose();
  } catch (err: any) {
    // Handle different error types
    if (err.code === 'PGRST116') {
      setError('Project not found');
    } else if (err.message?.includes('permission')) {
      setError('You do not have permission to create projects');
    } else {
      setError(err.message || 'Failed to create project');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## TypeScript Patterns

### Type Definitions

```typescript
// core/models/Project.ts

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  // ... other fields
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  // ... required fields only
}

export type UpdateProjectPayload = Partial<Omit<Project, 'id' | 'createdAt'>>;
```

### Generic Types

```typescript
// Utility type for API responses
type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
};

// Usage
async function getProject(id: string): Promise<ApiResponse<Project>> {
  try {
    const project = await fetchProject(id);
    return { data: project, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
```

### Type Guards

```typescript
// Type guard for Project
function isProject(obj: any): obj is Project {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Object.values(ProjectStatus).includes(obj.status)
  );
}

// Usage
if (isProject(data)) {
  // TypeScript knows data is Project here
  console.log(data.name);
}
```

---

## Testing Guide

### Unit Testing Services

```typescript
// __tests__/services/ProjectService.test.ts

import { projectService } from '../../core/services/ProjectService';
import { ProjectStatus } from '../../core/models/Project';

describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create project with valid data', () => {
      const project = projectService.createProject({
        name: 'Test Project',
        description: 'Test Description',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budgetAllocated: 100000,
        currency: 'USD',
        clientId: 'client-1',
      });

      expect(project.name).toBe('Test Project');
      expect(project.status).toBe(ProjectStatus.ACTIVE);
      expect(project.budgetSpent).toBe(0);
    });

    it('should throw error for invalid dates', () => {
      expect(() => {
        projectService.createProject({
          name: 'Test',
          description: 'Test',
          startDate: '2024-12-31',
          endDate: '2024-01-01', // End before start
          budgetAllocated: 100000,
          currency: 'USD',
          clientId: 'client-1',
        });
      }).toThrow('Start date must be before end date');
    });
  });

  describe('calculateTotalSpend', () => {
    it('should calculate total spend correctly', () => {
      const project: Project = {
        id: 'proj-1',
        name: 'Test',
        budgetSpent: 50000,
        resourceAllocations: [{
          id: 'ra-1',
          teamId: 'team-1',
          monthlyRate: 10000,
          startDate: '2024-01-01',
          endDate: '2024-06-30',
        }],
        // ... other required fields
      };

      const total = projectService.calculateTotalSpend(project);
      expect(total).toBeGreaterThan(50000);
    });
  });
});
```

### Component Testing

```typescript
// __tests__/components/ProjectList.test.tsx

import { render, screen } from '@testing-library/react';
import ProjectList from '../../components/ProjectList';

const mockProjects = [
  {
    id: 'proj-1',
    name: 'Test Project',
    // ... other fields
  },
];

describe('ProjectList', () => {
  it('should render projects', () => {
    render(
      <ProjectList
        projects={mockProjects}
        tasks={[]}
        onProjectClick={jest.fn()}
        currency="USD"
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should call onProjectClick when project is clicked', () => {
    const handleClick = jest.fn();
    render(
      <ProjectList
        projects={mockProjects}
        tasks={[]}
        onProjectClick={handleClick}
        currency="USD"
      />
    );

    screen.getByText('Test Project').click();
    expect(handleClick).toHaveBeenCalledWith('proj-1');
  });
});
```

---

## Extending the Codebase

### Adding a New Feature

#### Step 1: Define Domain Model

```typescript
// core/models/Invoice.ts

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoicePayload {
  projectId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
}
```

#### Step 2: Create Service

```typescript
// core/services/InvoiceService.ts

import { Invoice, CreateInvoicePayload } from '../models/Invoice';

export class InvoiceService {
  createInvoice(payload: CreateInvoicePayload): Invoice {
    // Business logic here
    return {
      id: this.generateId(),
      ...payload,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  
  private generateId(): string {
    return `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const invoiceService = new InvoiceService();
```

#### Step 3: Create Supabase Service

```typescript
// lib/supabase/services/invoices.ts

import { supabase } from '../client';
import type { Invoice, CreateInvoicePayload } from '../../../core/models/Invoice';

export async function getInvoices(projectId?: string): Promise<Invoice[]> {
  let query = supabase.from('invoices').select('*');
  
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
  
  return (data || []).map(transformInvoice);
}

function transformInvoice(data: any): Invoice {
  return {
    id: data.id,
    projectId: data.project_id,
    invoiceNumber: data.invoice_number,
    amount: parseFloat(data.amount),
    dueDate: data.due_date,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
```

#### Step 4: Create UI Component

```typescript
// components/InvoicesView.tsx

import React, { useState, useEffect } from 'react';
import { getInvoices } from '../lib/supabase/services/invoices';
import type { Invoice } from '../core/models/Invoice';

interface InvoicesViewProps {
  projectId?: string;
}

const InvoicesView: React.FC<InvoicesViewProps> = ({ projectId }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, [projectId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await getInvoices(projectId);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading invoices...</div>;
  }

  return (
    <div>
      <h2>Invoices</h2>
      {invoices.map(invoice => (
        <div key={invoice.id}>
          {/* Invoice card */}
        </div>
      ))}
    </div>
  );
};

export default InvoicesView;
```

#### Step 5: Wire Up in App

```typescript
// App.tsx

import InvoicesView from './components/InvoicesView';

// Add to renderContent or navigation
```

---

## Performance Optimization

### Code Splitting

```typescript
// Lazy load components
import { lazy, Suspense } from 'react';

const ProjectDetail = lazy(() => import('./components/ProjectDetail'));

// Usage
<Suspense fallback={<div>Loading...</div>}>
  <ProjectDetail project={project} />
</Suspense>
```

### Memoization

```typescript
import { useMemo } from 'react';

const ProjectList: React.FC<ProjectListProps> = ({ projects, tasks }) => {
  // Memoize expensive calculations
  const projectStats = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const totalSpent = getTotalProjectSpend(project);
      return { project, projectTasks, totalSpent };
    });
  }, [projects, tasks]);

  return (
    // Render using projectStats
  );
};
```

### Query Optimization

```typescript
// Batch queries
const loadProjectData = async (projectId: string) => {
  const [project, tasks, teams] = await Promise.all([
    getProjectById(projectId),
    getTasksByProject(projectId),
    getTeams(),
  ]);
  
  return { project, tasks, teams };
};

// Use select to limit fields
const { data } = await supabase
  .from('projects')
  .select('id, name, status') // Only fetch needed fields
  .eq('status', 'active');
```

---

## Debugging Guide

### Common Issues

#### 1. RLS Policy Errors

```typescript
// Error: "new row violates row-level security policy"
// Solution: Check RLS policies in Supabase dashboard
// Verify user role and permissions
```

#### 2. Type Errors

```typescript
// Error: Type 'X' is not assignable to type 'Y'
// Solution: Check model definitions, ensure types match
// Use type assertions carefully: data as Project
```

#### 3. Async/Await Issues

```typescript
// Error: Cannot read property 'X' of undefined
// Solution: Always check for null/undefined
const project = await getProjectById(id);
if (!project) {
  console.error('Project not found');
  return;
}
// Now safe to use project
```

### Debugging Tools

```typescript
// Console logging
console.log('Debug:', { projects, tasks });

// React DevTools
// - Component tree inspection
// - Props and state inspection
// - Performance profiling

// Supabase Dashboard
// - SQL Editor for direct queries
// - Logs for API errors
// - Auth logs for authentication issues
```

---

## Code Examples

### Complete Feature Implementation

See the "Extending the Codebase" section for a complete example of adding a new feature (Invoice system).

### Common Patterns

#### Loading State Pattern

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<DataType[]>([]);

const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    const result = await fetchData();
    setData(result);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

#### Form Handling Pattern

```typescript
const [formData, setFormData] = useState<FormData>({
  field1: '',
  field2: '',
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await submitForm(formData);
    // Success handling
  } catch (error) {
    // Error handling
  }
};
```

---

## Best Practices

### Code Organization

1. **One file per class/component**
2. **Index files for clean imports**
3. **Clear naming conventions**
4. **Consistent file structure**

### Documentation

1. **JSDoc for all public methods**
2. **Inline comments for complex logic**
3. **README files for major features**
4. **Type definitions are self-documenting**

### Error Handling

1. **Always handle errors at component level**
2. **Log errors for debugging**
3. **Show user-friendly error messages**
4. **Use try-catch for async operations**

### Performance

1. **Memoize expensive calculations**
2. **Lazy load heavy components**
3. **Optimize database queries**
4. **Use React.memo for expensive renders**

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** Development Team

For questions about the codebase, refer to:
- This documentation
- Inline code comments
- ARCHITECTURE.md for high-level design
- CLIENT_DOCUMENTATION.md for user-facing docs
