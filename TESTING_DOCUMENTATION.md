# Nexus PM - Testing Documentation

**Version:** 1.0  
**Last Updated:** January 2025  
**Audience:** Developers, QA Engineers, Technical Leads

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Testing Setup](#testing-setup)
3. [Testing Strategy](#testing-strategy)
4. [Unit Testing](#unit-testing)
5. [Integration Testing](#integration-testing)
6. [Component Testing](#component-testing)
7. [E2E Testing](#e2e-testing)
8. [Mocking & Test Utilities](#mocking--test-utilities)
9. [Test Coverage](#test-coverage)
10. [CI/CD Integration](#cicd-integration)
11. [Best Practices](#best-practices)
12. [Common Patterns](#common-patterns)
13. [Troubleshooting](#troubleshooting)

---

## Testing Overview

### Testing Philosophy

Nexus PM follows a **test-driven development** approach with emphasis on:

- **Testability**: Code is designed to be easily testable
- **Isolation**: Tests are independent and can run in any order
- **Speed**: Fast feedback loop with quick test execution
- **Coverage**: Comprehensive coverage of business logic
- **Maintainability**: Tests are readable and maintainable

### Testing Pyramid

```
        /\
       /  \      E2E Tests (Few)
      /____\     - Critical user flows
     /      \    
    /________\   Integration Tests (Some)
   /          \  - Service + Repository interactions
  /____________\ - API integration
 /              \
/________________\ Unit Tests (Many)
                  - Business logic
                  - Utility functions
                  - Pure functions
```

### Testing Tools

**Recommended Stack:**
- **Vitest**: Fast unit test runner (Vite-native)
- **React Testing Library**: Component testing
- **MSW (Mock Service Worker)**: API mocking
- **Playwright**: E2E testing
- **Testing Library**: User-centric testing utilities

---

## Testing Setup

### Installation

```bash
# Install testing dependencies
npm install -D vitest @vitest/ui
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
npm install -D @testing-library/react-hooks
npm install -D msw
npm install -D @playwright/test
npm install -D jsdom
```

### Configuration

#### Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### Test Setup File (`src/test/setup.ts`)

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

#### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Testing Strategy

### Test Categories

#### 1. Unit Tests
- **Target**: Services, utilities, pure functions
- **Scope**: Single function/class in isolation
- **Speed**: Very fast (< 10ms per test)
- **Coverage**: High (80%+)

#### 2. Integration Tests
- **Target**: Service + Repository interactions
- **Scope**: Multiple layers working together
- **Speed**: Fast (< 100ms per test)
- **Coverage**: Medium (60%+)

#### 3. Component Tests
- **Target**: React components
- **Scope**: Component rendering and interactions
- **Speed**: Fast (< 200ms per test)
- **Coverage**: Medium (70%+)

#### 4. E2E Tests
- **Target**: Complete user flows
- **Scope**: Full application
- **Speed**: Slow (seconds per test)
- **Coverage**: Low (critical paths only)

### Test Organization

```
src/
├── __tests__/              # Test files co-located
│   ├── core/
│   │   ├── services/
│   │   │   ├── ProjectService.test.ts
│   │   │   └── TaskService.test.ts
│   │   └── models/
│   │       └── Project.test.ts
│   └── utils/
│       └── currency.test.ts
│
├── components/
│   ├── ProjectList.tsx
│   └── __tests__/
│       └── ProjectList.test.tsx
│
└── test/                   # Test utilities and setup
    ├── setup.ts
    ├── mocks/
    │   ├── supabase.ts
    │   └── handlers.ts
    └── utils/
        ├── render.tsx
        └── test-utils.ts
```

---

## Unit Testing

### Service Testing

#### ProjectService Tests

```typescript
// __tests__/core/services/ProjectService.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { projectService } from '../../../core/services/ProjectService';
import { ProjectStatus } from '../../../core/models/Project';

describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create project with valid data', () => {
      const payload = {
        name: 'Test Project',
        description: 'Test Description',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budgetAllocated: 100000,
        currency: 'USD' as const,
        clientId: 'client-1',
      };

      const project = projectService.createProject(payload);

      expect(project).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.status).toBe(ProjectStatus.ACTIVE);
      expect(project.budgetSpent).toBe(0);
      expect(project.budgetAllocated).toBe(100000);
      expect(project.id).toMatch(/^proj-/);
    });

    it('should throw error when start date is after end date', () => {
      const payload = {
        name: 'Test Project',
        description: 'Test Description',
        startDate: '2024-12-31',
        endDate: '2024-01-01', // Invalid: end before start
        budgetAllocated: 100000,
        currency: 'USD' as const,
        clientId: 'client-1',
      };

      expect(() => {
        projectService.createProject(payload);
      }).toThrow('Start date must be before end date');
    });

    it('should throw error when budget is zero or negative', () => {
      const payload = {
        name: 'Test Project',
        description: 'Test Description',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budgetAllocated: 0, // Invalid
        currency: 'USD' as const,
        clientId: 'client-1',
      };

      expect(() => {
        projectService.createProject(payload);
      }).toThrow('Budget must be greater than zero');
    });

    it('should create deliverables when provided', () => {
      const payload = {
        name: 'Test Project',
        description: 'Test Description',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budgetAllocated: 100000,
        currency: 'USD' as const,
        clientId: 'client-1',
        deliverables: [
          {
            title: 'Deliverable 1',
            description: 'First deliverable',
            dueDate: '2024-06-30',
          },
        ],
      };

      const project = projectService.createProject(payload);

      expect(project.deliverables).toHaveLength(1);
      expect(project.deliverables[0].title).toBe('Deliverable 1');
      expect(project.deliverables[0].isCompleted).toBe(false);
    });
  });

  describe('calculateTotalSpend', () => {
    it('should calculate total spend including expenses and resources', () => {
      const project: Project = {
        id: 'proj-1',
        name: 'Test',
        description: 'Test',
        status: ProjectStatus.ACTIVE,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budgetAllocated: 100000,
        budgetSpent: 50000,
        currency: 'USD',
        expenses: [],
        resourceAllocations: [
          {
            id: 'ra-1',
            teamId: 'team-1',
            monthlyRate: 10000,
            startDate: '2024-01-01',
            endDate: '2024-06-30', // 6 months
          },
        ],
        deliverables: [],
        assignedTeamIds: [],
        clientId: 'client-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const total = projectService.calculateTotalSpend(project);

      // Manual expenses: 50000
      // Resource costs: ~60000 (6 months * 10000)
      // Total: ~110000
      expect(total).toBeGreaterThan(100000);
      expect(total).toBeLessThan(120000);
    });

    it('should return zero for project with no expenses or resources', () => {
      const project: Project = {
        id: 'proj-1',
        name: 'Test',
        description: 'Test',
        status: ProjectStatus.ACTIVE,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budgetAllocated: 100000,
        budgetSpent: 0,
        currency: 'USD',
        expenses: [],
        resourceAllocations: [],
        deliverables: [],
        assignedTeamIds: [],
        clientId: 'client-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const total = projectService.calculateTotalSpend(project);
      expect(total).toBe(0);
    });
  });

  describe('validateProjectDates', () => {
    it('should return true for valid dates', () => {
      const isValid = projectService.validateProjectDates(
        '2024-01-01',
        '2024-12-31'
      );
      expect(isValid).toBe(true);
    });

    it('should return false when start equals end', () => {
      const isValid = projectService.validateProjectDates(
        '2024-01-01',
        '2024-01-01'
      );
      expect(isValid).toBe(false);
    });

    it('should return false when start is after end', () => {
      const isValid = projectService.validateProjectDates(
        '2024-12-31',
        '2024-01-01'
      );
      expect(isValid).toBe(false);
    });
  });

  describe('canArchiveProject', () => {
    it('should return true for active projects', () => {
      const project: Project = {
        // ... project with status ACTIVE
        status: ProjectStatus.ACTIVE,
      };

      const canArchive = projectService.canArchiveProject(project);
      expect(canArchive).toBe(true);
    });

    it('should return false for archived projects', () => {
      const project: Project = {
        // ... project with status ARCHIVED
        status: ProjectStatus.ARCHIVED,
      };

      const canArchive = projectService.canArchiveProject(project);
      expect(canArchive).toBe(false);
    });
  });
});
```

#### TaskService Tests

```typescript
// __tests__/core/services/TaskService.test.ts

import { describe, it, expect } from 'vitest';
import { taskService } from '../../../core/services/TaskService';
import { TaskStatus, Priority } from '../../../core/models/Task';
import type { Task } from '../../../core/models/Task';

describe('TaskService', () => {
  describe('updateTaskStatus', () => {
    it('should update task status when transition is valid', () => {
      const task: Task = {
        id: 'task-1',
        projectId: 'proj-1',
        title: 'Test Task',
        description: 'Test',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dependencies: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const updated = taskService.updateTaskStatus(
        task,
        TaskStatus.IN_PROGRESS,
        []
      );

      expect(updated.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updated.updatedAt).not.toBe(task.updatedAt);
    });

    it('should throw error for invalid status transition', () => {
      const task: Task = {
        id: 'task-1',
        projectId: 'proj-1',
        title: 'Test Task',
        description: 'Test',
        status: TaskStatus.DONE,
        priority: Priority.MEDIUM,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dependencies: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => {
        taskService.updateTaskStatus(task, TaskStatus.TODO, []);
      }).toThrow('Cannot transition');
    });

    it('should validate dependencies before marking as done', () => {
      const dependency: Task = {
        id: 'task-2',
        projectId: 'proj-1',
        title: 'Dependency',
        description: 'Test',
        status: TaskStatus.IN_PROGRESS, // Not done
        priority: Priority.MEDIUM,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dependencies: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const task: Task = {
        id: 'task-1',
        projectId: 'proj-1',
        title: 'Test Task',
        description: 'Test',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dependencies: ['task-2'], // Depends on task-2
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => {
        taskService.updateTaskStatus(task, TaskStatus.DONE, [dependency]);
      }).toThrow('Dependencies incomplete');
    });
  });

  describe('validateDependencies', () => {
    it('should return true for valid dependency graph', () => {
      const task: Task = {
        id: 'task-1',
        projectId: 'proj-1',
        title: 'Test',
        description: 'Test',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dependencies: ['task-2'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const allTasks: Task[] = [
        task,
        {
          id: 'task-2',
          projectId: 'proj-1',
          title: 'Dependency',
          description: 'Test',
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          dependencies: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const isValid = taskService.validateDependencies(task, allTasks);
      expect(isValid).toBe(true);
    });

    it('should return false for circular dependencies', () => {
      const task1: Task = {
        id: 'task-1',
        projectId: 'proj-1',
        title: 'Task 1',
        description: 'Test',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dependencies: ['task-2'], // Depends on task-2
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const task2: Task = {
        id: 'task-2',
        projectId: 'proj-1',
        title: 'Task 2',
        description: 'Test',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dependencies: ['task-1'], // Depends on task-1 (circular!)
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const isValid = taskService.validateDependencies(task1, [task1, task2]);
      expect(isValid).toBe(false);
    });
  });
});
```

### Utility Function Testing

```typescript
// __tests__/utils/currency.test.ts

import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../../utils/currency';

describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('should format EUR correctly', () => {
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-100, 'USD')).toBe('-$100.00');
  });

  it('should handle large numbers', () => {
    expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000.00');
  });
});
```

---

## Integration Testing

### Service + Repository Integration

```typescript
// __tests__/integration/ProjectService.integration.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { projectService } from '../../core/services/ProjectService';
import { ProjectRepository } from '../../data/repositories/ProjectRepository';
import type { Project } from '../../core/models/Project';

describe('ProjectService + Repository Integration', () => {
  let repository: ProjectRepository;

  beforeEach(() => {
    repository = new ProjectRepository(projectService);
    repository.initialize([]); // Start with empty repository
  });

  it('should create and persist project', () => {
    const payload = {
      name: 'Integration Test Project',
      description: 'Test',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      budgetAllocated: 100000,
      currency: 'USD' as const,
      clientId: 'client-1',
    };

    // Create project via service
    const project = projectService.createProject(payload);

    // Persist via repository
    repository.create(project);

    // Retrieve from repository
    const retrieved = repository.getById(project.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Integration Test Project');
    expect(retrieved?.id).toBe(project.id);
  });

  it('should update project through service and repository', () => {
    // Create initial project
    const project = projectService.createProject({
      name: 'Original Name',
      description: 'Test',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      budgetAllocated: 100000,
      currency: 'USD' as const,
      clientId: 'client-1',
    });

    repository.create(project);

    // Update via service
    const updated = projectService.updateProject(project.id, {
      name: 'Updated Name',
    });

    // Persist update
    repository.update(project.id, updated);

    // Verify update
    const retrieved = repository.getById(project.id);
    expect(retrieved?.name).toBe('Updated Name');
  });
});
```

### Supabase Integration Tests

```typescript
// __tests__/integration/supabase/Projects.integration.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createProject, getProjects } from '../../../lib/supabase/services/projects';
import { supabase } from '../../../lib/supabase/client';

describe('Supabase Projects Integration', () => {
  let createdProjectId: string;

  beforeAll(async () => {
    // Setup: Ensure test user is authenticated
    // This would typically use a test user account
  });

  afterAll(async () => {
    // Cleanup: Delete test project
    if (createdProjectId) {
      await supabase.from('projects').delete().eq('id', createdProjectId);
    }
  });

  it('should create project in Supabase', async () => {
    const project = await createProject({
      name: 'Test Project',
      description: 'Integration test project',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      budgetAllocated: 100000,
      currency: 'USD',
      clientId: 'test-client-id', // Use test client ID
    });

    expect(project).toBeDefined();
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Test Project');

    createdProjectId = project.id;
  });

  it('should retrieve projects from Supabase', async () => {
    const projects = await getProjects();

    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it('should filter projects by status', async () => {
    const activeProjects = await getProjects({ status: 'active' });

    expect(activeProjects.every(p => p.status === 'active')).toBe(true);
  });
});
```

---

## Component Testing

### Component Test Setup

```typescript
// test/utils/render.tsx

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
    </>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### ProjectList Component Tests

```typescript
// components/__tests__/ProjectList.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils/render';
import ProjectList from '../ProjectList';
import { mockProjects, mockTasks } from '../../../mockData';

describe('ProjectList', () => {
  const defaultProps = {
    projects: mockProjects,
    tasks: mockTasks,
    onProjectClick: vi.fn(),
    currency: 'USD' as const,
  };

  it('should render project list', () => {
    render(<ProjectList {...defaultProps} />);

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText(/Managing \d+ active initiatives/)).toBeInTheDocument();
  });

  it('should display all projects', () => {
    render(<ProjectList {...defaultProps} />);

    mockProjects.forEach(project => {
      expect(screen.getByText(project.name)).toBeInTheDocument();
    });
  });

  it('should call onProjectClick when project is clicked', async () => {
    const handleClick = vi.fn();
    render(<ProjectList {...defaultProps} onProjectClick={handleClick} />);

    const projectCard = screen.getByText(mockProjects[0].name).closest('div');
    projectCard?.click();

    expect(handleClick).toHaveBeenCalledWith(mockProjects[0].id);
  });

  it('should show create project button when onCreateProject is provided', () => {
    const onCreateProject = vi.fn();
    render(<ProjectList {...defaultProps} onCreateProject={onCreateProject} />);

    expect(screen.getByText('Create Project')).toBeInTheDocument();
  });

  it('should call onCreateProject when create button is clicked', () => {
    const onCreateProject = vi.fn();
    render(<ProjectList {...defaultProps} onCreateProject={onCreateProject} />);

    screen.getByText('Create Project').click();
    expect(onCreateProject).toHaveBeenCalled();
  });

  it('should display project budget information', () => {
    render(<ProjectList {...defaultProps} />);

    // Check that budget information is displayed
    const project = mockProjects[0];
    expect(screen.getByText(new RegExp(project.budgetAllocated.toString()))).toBeInTheDocument();
  });
});
```

### CreateProjectModal Component Tests

```typescript
// components/__tests__/CreateProjectModal.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test/utils/render';
import userEvent from '@testing-library/user-event';
import CreateProjectModal from '../CreateProjectModal';
import * as projectsService from '../../../lib/supabase/services/projects';

// Mock the service
vi.mock('../../../lib/supabase/services/projects');

describe('CreateProjectModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    currency: 'USD' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(<CreateProjectModal {...defaultProps} />);

    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<CreateProjectModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
  });

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<CreateProjectModal {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    vi.spyOn(projectsService, 'createProject').mockResolvedValue({} as any);

    render(<CreateProjectModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /create project/i });
    await user.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
    });

    expect(projectsService.createProject).not.toHaveBeenCalled();
  });

  it('should create project when form is valid', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const mockProject = {
      id: 'proj-1',
      name: 'Test Project',
      // ... other fields
    };

    vi.spyOn(projectsService, 'createProject').mockResolvedValue(mockProject as any);

    render(<CreateProjectModal {...defaultProps} onSuccess={onSuccess} />);

    // Fill form
    await user.type(screen.getByLabelText(/project name/i), 'Test Project');
    await user.type(screen.getByLabelText(/description/i), 'Test Description');
    await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
    await user.type(screen.getByLabelText(/end date/i), '2024-12-31');
    await user.type(screen.getByLabelText(/budget allocated/i), '100000');
    await user.type(screen.getByLabelText(/client id/i), 'client-1');

    // Submit
    const submitButton = screen.getByRole('button', { name: /create project/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(projectsService.createProject).toHaveBeenCalledWith({
        name: 'Test Project',
        description: 'Test Description',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budgetAllocated: 100000,
        currency: 'USD',
        clientId: 'client-1',
        assignedTeamIds: [],
      });
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should display error message on creation failure', async () => {
    const user = userEvent.setup();
    const error = new Error('Failed to create project');
    vi.spyOn(projectsService, 'createProject').mockRejectedValue(error);

    render(<CreateProjectModal {...defaultProps} />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/project name/i), 'Test Project');
    // ... fill other fields
    await user.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create project/i)).toBeInTheDocument();
    });
  });
});
```

---

## E2E Testing

### Playwright Configuration

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// e2e/projects.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login (assuming auth is set up)
    await page.goto('/');
    // ... login steps
  });

  test('should create a new project', async ({ page }) => {
    // Navigate to projects page
    await page.click('text=Projects');
    
    // Click create project button
    await page.click('text=Create Project');
    
    // Fill form
    await page.fill('input[name="name"]', 'E2E Test Project');
    await page.fill('textarea[name="description"]', 'E2E test description');
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-12-31');
    await page.fill('input[name="budgetAllocated"]', '100000');
    await page.fill('input[name="clientId"]', 'test-client-id');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify project appears in list
    await expect(page.locator('text=E2E Test Project')).toBeVisible();
  });

  test('should view project details', async ({ page }) => {
    // Navigate to projects
    await page.click('text=Projects');
    
    // Click on a project
    await page.click('text=Test Project');
    
    // Verify project detail page loads
    await expect(page.locator('h2:has-text("Test Project")')).toBeVisible();
    await expect(page.locator('text=Overview')).toBeVisible();
  });

  test('should filter projects by status', async ({ page }) => {
    await page.click('text=Projects');
    
    // Apply filter (if filter UI exists)
    await page.selectOption('select[name="status"]', 'active');
    
    // Verify only active projects shown
    const projects = page.locator('[data-testid="project-card"]');
    const count = await projects.count();
    
    for (let i = 0; i < count; i++) {
      const project = projects.nth(i);
      await expect(project.locator('[data-status="active"]')).toBeVisible();
    }
  });
});
```

---

## Mocking & Test Utilities

### Supabase Mocking

```typescript
// test/mocks/supabase.ts

import { vi } from 'vitest';

export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
};

// Mock Supabase module
vi.mock('../../lib/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));
```

### MSW Handlers

```typescript
// test/mocks/handlers.ts

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  // Mock GET projects
  http.get('https://*.supabase.co/rest/v1/projects', () => {
    return HttpResponse.json([
      {
        id: 'proj-1',
        name: 'Mock Project',
        status: 'active',
        // ... other fields
      },
    ]);
  }),

  // Mock POST project
  http.post('https://*.supabase.co/rest/v1/projects', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 'proj-new',
      ...body,
    }, { status: 201 });
  }),
];

export const server = setupServer(...handlers);
```

### Test Utilities

```typescript
// test/utils/test-utils.ts

import { Project, Task, Team } from '../../core/models';

export const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: 'proj-1',
  name: 'Test Project',
  description: 'Test Description',
  status: 'active' as const,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  budgetAllocated: 100000,
  budgetSpent: 0,
  currency: 'USD',
  expenses: [],
  resourceAllocations: [],
  deliverables: [],
  assignedTeamIds: [],
  clientId: 'client-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: 'task-1',
  projectId: 'proj-1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'todo' as const,
  priority: 'medium' as const,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  dependencies: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});
```

---

## Test Coverage

### Coverage Goals

- **Services**: 80%+ coverage
- **Utilities**: 90%+ coverage
- **Components**: 70%+ coverage
- **Integration**: 60%+ coverage
- **E2E**: Critical paths only

### Coverage Configuration

```typescript
// vitest.config.ts

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        '**/index.ts', // Barrel exports
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

### Running Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:run
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Best Practices

### Test Organization

1. **Co-locate tests** with source files when possible
2. **Group related tests** using `describe` blocks
3. **Use descriptive test names** that explain what is being tested
4. **Keep tests focused** - one assertion per test when possible

### Test Naming

```typescript
// Good
describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create project with valid data', () => {});
    it('should throw error when dates are invalid', () => {});
  });
});

// Bad
describe('ProjectService', () => {
  it('test1', () => {});
  it('works', () => {});
});
```

### Test Data

1. **Use factories** for creating test data
2. **Keep tests independent** - don't rely on test execution order
3. **Clean up after tests** - use `beforeEach`/`afterEach` hooks
4. **Use realistic data** - test with data that mirrors production

### Assertions

```typescript
// Good - specific assertions
expect(project.status).toBe(ProjectStatus.ACTIVE);
expect(project.budgetAllocated).toBe(100000);

// Bad - vague assertions
expect(project).toBeTruthy();
```

### Async Testing

```typescript
// Good - use async/await
it('should fetch projects', async () => {
  const projects = await getProjects();
  expect(projects).toHaveLength(5);
});

// Good - use waitFor for UI updates
await waitFor(() => {
  expect(screen.getByText('Project Created')).toBeInTheDocument();
});
```

---

## Common Patterns

### Testing Hooks

```typescript
describe('Component', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  beforeAll(() => {
    // Setup once before all tests
  });

  afterAll(() => {
    // Cleanup once after all tests
  });
});
```

### Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event';

it('should handle user input', async () => {
  const user = userEvent.setup();
  
  const input = screen.getByLabelText('Name');
  await user.type(input, 'Test Name');
  
  expect(input).toHaveValue('Test Name');
});
```

### Testing Error States

```typescript
it('should display error message', async () => {
  vi.spyOn(api, 'fetchProjects').mockRejectedValue(new Error('Failed'));
  
  render(<ProjectList />);
  
  await waitFor(() => {
    expect(screen.getByText(/error loading projects/i)).toBeInTheDocument();
  });
});
```

---

## Troubleshooting

### Common Issues

#### Tests Not Running

```bash
# Check Vitest is installed
npm list vitest

# Clear cache
rm -rf node_modules/.vite
```

#### Mock Not Working

```typescript
// Ensure mocks are hoisted
vi.mock('./module', () => ({
  function: vi.fn(),
}));
```

#### Async Test Timeout

```typescript
// Increase timeout
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

#### Coverage Not Generated

```bash
# Install coverage provider
npm install -D @vitest/coverage-v8

# Run with coverage flag
npm run test:coverage
```

---

## Quick Reference

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run specific test file
npm test ProjectService.test.ts

# Run tests matching pattern
npm test -- -t "createProject"

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test File Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { functionToTest } from './module';

describe('ModuleName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** Development Team

For questions about testing, refer to:
- This documentation
- Vitest documentation: https://vitest.dev
- React Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev
