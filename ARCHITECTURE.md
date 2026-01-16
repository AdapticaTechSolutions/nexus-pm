# Nexus PM - Architecture Documentation

## Overview

Nexus PM is built using **Clean Architecture** principles, ensuring separation of concerns, testability, and maintainability. The codebase is designed to be understood by new developers within 30 minutes and maintained by multiple developers over several years.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (Components)                │
│  React components, views, layouts                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Business Logic Layer (Services)             │
│  ProjectService, TaskService, TeamService, TicketService│
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Domain Models Layer (Core)                  │
│  Project, Task, Team, Ticket, Client models             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            Data Access Layer (Repositories)              │
│  ProjectRepository, TaskRepository, etc.                │
└──────────────────────────────────────────────────────────┘
```

## Directory Structure

```
nexus-pm/
├── core/                    # Core business logic
│   ├── models/              # Domain models and types
│   │   ├── Project.ts       # Project entity and related types
│   │   ├── Task.ts          # Task, TaskGroup, Milestone entities
│   │   ├── Team.ts          # Team and TeamMember entities
│   │   ├── Ticket.ts        # Ticket entity
│   │   ├── Client.ts        # Client entity
│   │   └── index.ts         # Central export
│   └── services/            # Business logic services
│       ├── ProjectService.ts    # Project business rules
│       ├── TaskService.ts        # Task business rules
│       ├── TeamService.ts        # Team business rules
│       ├── TicketService.ts      # Ticket business rules
│       └── index.ts              # Central export
├── data/                    # Data access layer
│   └── repositories/        # Data repositories
│       ├── ProjectRepository.ts
│       ├── TaskRepository.ts
│       ├── TeamRepository.ts
│       ├── TicketRepository.ts
│       └── index.ts
├── config/                  # Configuration
│   └── AppConfig.ts         # Feature flags and app settings
├── components/              # UI components
│   ├── Dashboard.tsx
│   ├── ProjectDetail.tsx
│   ├── GanttChart.tsx
│   └── ...
├── utils/                   # Utility functions
│   ├── currency.ts
│   └── financials.ts
└── types.ts                 # Backward compatibility layer
```

## Core Principles

### 1. Separation of Concerns

- **UI Layer**: Handles presentation and user interaction only
- **Service Layer**: Contains all business logic and rules
- **Model Layer**: Defines domain entities and their structure
- **Repository Layer**: Handles data persistence and retrieval

### 2. Dependency Direction

Dependencies flow inward:
- UI depends on Services
- Services depend on Models
- Repositories depend on Models and Services
- **Never**: Services depend on UI or Repositories depend on UI

### 3. Single Responsibility

Each class/service has one reason to change:
- `ProjectService`: Only handles project business logic
- `TaskService`: Only handles task business logic
- `TeamService`: Only handles team business logic

### 4. Open/Closed Principle

- Services are open for extension (via interfaces)
- Closed for modification (business rules don't change UI code)

## Domain Models

### Project Model

**Location**: `core/models/Project.ts`

Represents a project with:
- Timeline (start/end dates)
- Budget tracking (allocated, spent, expenses, resource allocations)
- Deliverables
- Team assignments
- Client relationship
- Status lifecycle (draft, active, archived)

**Key Business Rules**:
- Start date must be before end date
- Budget must be positive
- Only active projects can be modified
- Projects must be archived before deletion

### Task Model

**Location**: `core/models/Task.ts`

Represents a task with:
- Workflow status (todo, in-progress, review, blocked, done, cancelled)
- Priority levels
- Dependencies (other tasks)
- Assignment (team or individual members)
- Timeline (start, end, due dates)
- Grouping (optional task group/epic)

**Key Business Rules**:
- Tasks cannot have circular dependencies
- Tasks cannot be marked done if dependencies are incomplete
- Status transitions must follow configured workflow

### Team Model

**Location**: `core/models/Team.ts`

Represents a team with:
- Team members
- Name and description

**Key Business Rules**:
- Teams must have at least one member
- Teams cannot be deleted if assigned to projects or tasks

### Ticket Model

**Location**: `core/models/Ticket.ts`

Represents a ticket/inquiry with:
- Type (inquiry, issue, feature_request, backlog_item)
- Status workflow
- Priority
- Reporter information
- Assignment
- Resolution tracking

**Key Business Rules**:
- Tickets follow configured workflow transitions
- Client ticketing must be enabled to create tickets

## Services

### ProjectService

**Location**: `core/services/ProjectService.ts`

**Responsibilities**:
- Create, update, archive, remove projects
- Calculate total spend (expenses + accrued resources)
- Calculate remaining budget
- Validate project dates
- Enforce business rules (archived projects cannot be modified)

**Key Methods**:
- `createProject(payload)`: Creates new project with validation
- `updateProject(id, updates)`: Updates project with business rule checks
- `archiveProject(id)`: Archives a project
- `calculateTotalSpend(project)`: Calculates total spend including resources
- `canDeleteProject(project)`: Validates project can be deleted

### TaskService

**Location**: `core/services/TaskService.ts`

**Responsibilities**:
- Create, update, delete tasks
- Manage task groups/epics
- Validate dependencies (no circular dependencies)
- Handle workflow transitions
- Ensure dependencies are completed before marking task as done

**Key Methods**:
- `createTask(payload)`: Creates task with validation
- `updateTaskStatus(task, newStatus, allTasks)`: Updates status with workflow validation
- `validateDependencies(task, allTasks)`: Validates dependency graph
- `canTransitionStatus(current, new)`: Checks if status transition is allowed

### TeamService

**Location**: `core/services/TeamService.ts`

**Responsibilities**:
- Create, update, delete teams
- Validate safe deletion (no orphaned assignments)
- Get team assignments (projects, tasks)

**Key Methods**:
- `createTeam(payload)`: Creates team with validation
- `deleteTeam(id, projects, tasks)`: Deletes team with safety checks
- `canDeleteTeam(id, projects, tasks)`: Validates team can be safely deleted

### TicketService

**Location**: `core/services/TicketService.ts`

**Responsibilities**:
- Create, update tickets
- Handle ticket workflow transitions
- Resolve tickets
- Validate ticket creation (feature flags)

**Key Methods**:
- `createTicket(payload)`: Creates ticket (validates feature flags)
- `updateTicketStatus(ticket, newStatus)`: Updates status with workflow validation
- `resolveTicket(id, resolution, resolvedBy)`: Resolves a ticket

## Repositories

Repositories handle data persistence. Currently implemented as in-memory stores, but designed to be easily swapped with database implementations.

### ProjectRepository

**Location**: `data/repositories/ProjectRepository.ts`

**Responsibilities**:
- CRUD operations for projects
- Query projects by status, client, etc.
- Initialize with existing data

### TaskRepository

**Location**: `data/repositories/TaskRepository.ts`

**Responsibilities**:
- CRUD operations for tasks and task groups
- Query tasks by project, group, status
- Validate dependencies before saving

### TeamRepository

**Location**: `data/repositories/TeamRepository.ts`

**Responsibilities**:
- CRUD operations for teams
- Safe deletion (validates no assignments)

### TicketRepository

**Location**: `data/repositories/TicketRepository.ts`

**Responsibilities**:
- CRUD operations for tickets
- Query tickets by project, status, type

## Configuration System

**Location**: `config/AppConfig.ts`

The application uses a centralized configuration system for feature flags and settings.

### Feature Flags

- `ganttChartEnabled`: Enable/disable Gantt chart view
- `kanbanBoardEnabled`: Enable/disable Kanban board view
- `budgetTrackingEnabled`: Enable/disable budget tracking
- `clientTicketingEnabled`: Enable/disable client ticketing
- `clientPortalEnabled`: Enable/disable client portal
- `taskDependenciesEnabled`: Enable/disable task dependencies
- `milestonesEnabled`: Enable/disable milestones
- `teamManagementEnabled`: Enable/disable team management
- `analyticsEnabled`: Enable/disable analytics

### Workflow Configuration

- **Task Workflow**: Defines available statuses and allowed transitions
- **Ticket Workflow**: Defines ticket statuses and transitions

### Usage

```typescript
import { getAppConfig } from './config/AppConfig';

const config = getAppConfig();
if (config.features.ganttChartEnabled) {
  // Show Gantt chart
}
```

## Data Flow

### Creating a Project

1. **UI Component** calls `projectService.createProject(payload)`
2. **ProjectService** validates input and applies business rules
3. **ProjectService** creates Project entity
4. **UI Component** calls `projectRepository.create(project)`
5. **Repository** persists project

### Updating Task Status

1. **UI Component** calls `taskService.updateTaskStatus(task, newStatus, allTasks)`
2. **TaskService** validates workflow transition
3. **TaskService** validates dependencies (if marking as done)
4. **TaskService** updates task entity
5. **UI Component** calls `taskRepository.update(id, updates)`
6. **Repository** persists changes

### Deleting a Team

1. **UI Component** calls `teamService.canDeleteTeam(id, projects, tasks)`
2. **TeamService** checks for assignments
3. If safe, **UI Component** calls `teamRepository.delete(id, projects, tasks)`
4. **TeamService** validates deletion
5. **Repository** removes team

## Testing Strategy

### Unit Tests

- **Services**: Test business logic in isolation
- **Repositories**: Test data operations with mock data
- **Models**: Test data structure and validation

### Integration Tests

- Test service + repository interactions
- Test workflow transitions
- Test dependency validation

### Component Tests

- Test UI components with mock services
- Test user interactions
- Test conditional rendering based on config

## Extension Points

### Adding a New Feature

1. **Define Model**: Create model in `core/models/`
2. **Create Service**: Implement business logic in `core/services/`
3. **Create Repository**: Implement data access in `data/repositories/`
4. **Add Feature Flag**: Add flag to `config/AppConfig.ts`
5. **Create UI**: Build components that use service
6. **Wire Up**: Connect UI to service in App.tsx

### Adding a New Workflow Status

1. Update enum in model (e.g., `TaskStatus`)
2. Update workflow config in `config/AppConfig.ts`
3. Add transitions to workflow config
4. Update UI components to handle new status

## Best Practices

### Code Organization

- **One file per class/interface**: Easier to find and maintain
- **Index files for exports**: Clean import statements
- **Clear naming**: Classes end with Service/Repository/Model

### Documentation

- **JSDoc comments**: All public methods documented
- **Inline comments**: Explain "why", not "what"
- **Architecture docs**: This file!

### Error Handling

- **Services throw errors**: Business rule violations throw descriptive errors
- **Repositories throw errors**: Data operations throw errors
- **UI handles errors**: Components catch and display errors

### Type Safety

- **TypeScript strict mode**: All types explicitly defined
- **No `any` types**: Use proper types or `unknown`
- **Interfaces for contracts**: Services use interfaces

## Migration Guide

### From Old Types to New Models

The `types.ts` file maintains backward compatibility by re-exporting from new models. Existing components continue to work, but new code should import directly from models:

```typescript
// Old (still works)
import { Project, Task } from './types';

// New (preferred)
import { Project } from './core/models/Project';
import { Task } from './core/models/Task';
```

### Using Services

```typescript
import { projectService } from './core/services/ProjectService';

// Create project
const project = projectService.createProject({
  name: 'New Project',
  description: '...',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  budgetAllocated: 100000,
  currency: 'USD',
  clientId: 'client-1',
});
```

### Using Repositories

```typescript
import { ProjectRepository } from './data/repositories/ProjectRepository';
import { projectService } from './core/services/ProjectService';

const repository = new ProjectRepository(projectService);
repository.initialize(mockProjects);

const project = repository.getById('proj-1');
```

## Future Enhancements

### Planned Improvements

1. **Database Integration**: Replace in-memory repositories with database
2. **Authentication**: Add user authentication and authorization
3. **Real-time Updates**: WebSocket support for live updates
4. **Advanced Analytics**: More reporting and analytics features
5. **API Layer**: RESTful API for external integrations
6. **Caching**: Add caching layer for performance
7. **Event System**: Event-driven architecture for decoupling

### Scalability Considerations

- Services are stateless (easy to scale horizontally)
- Repositories can be swapped (database, API, etc.)
- Configuration is centralized (easy to manage)
- Models are pure data (no side effects)

## Questions?

For questions about the architecture, please refer to:
1. This documentation
2. Inline code comments
3. JSDoc documentation in source files
