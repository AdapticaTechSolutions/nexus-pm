/**
 * Mock Data
 * 
 * Sample data for development and testing.
 * Matches the domain model structures defined in core/models.
 * 
 * @module mockData
 */

import { Project, Task, TaskGroup, Team, Client, TaskStatus, Priority, Ticket, TicketType } from './types';
import { ProjectStatus } from './core/models/Project';
import { TicketStatus } from './core/models/Ticket';

export const mockTeams: Team[] = [
  { 
    id: 'team-1', 
    name: 'Frontend Squad', 
    members: [
      { id: 'member-1', name: 'Alice', email: 'alice@example.com', role: 'Developer' },
      { id: 'member-2', name: 'Bob', email: 'bob@example.com', role: 'Developer' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  { 
    id: 'team-2', 
    name: 'Backend Core', 
    members: [
      { id: 'member-3', name: 'Charlie', email: 'charlie@example.com', role: 'Developer' },
      { id: 'member-4', name: 'Dave', email: 'dave@example.com', role: 'Developer' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  { 
    id: 'team-3', 
    name: 'Design Lab', 
    members: [
      { id: 'member-5', name: 'Eve', email: 'eve@example.com', role: 'Designer' },
      { id: 'member-6', name: 'Frank', email: 'frank@example.com', role: 'Designer' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export const mockClients: Client[] = [
  { 
    id: 'client-1', 
    name: 'Sarah Jenkins', 
    company: 'Global Innovators', 
    email: 'sarah@global.com',
    portalAccessEnabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Apollo Rebrand 2024',
    description: 'Complete overhaul of the digital brand identity and storefront.',
    status: ProjectStatus.ACTIVE,
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    budgetAllocated: 150000,
    budgetSpent: 45000,
    currency: 'USD',
    expenses: [
      { 
        id: 'e1', 
        category: 'Creative Assets', 
        amount: 20000, 
        date: '2024-01-15', 
        description: 'Initial stock photo licenses and logo drafts',
        createdAt: '2024-01-15T00:00:00Z',
      },
      { 
        id: 'e2', 
        category: 'Consulting', 
        amount: 25000, 
        date: '2024-02-10', 
        description: 'Brand strategy workshop',
        createdAt: '2024-02-10T00:00:00Z',
      },
    ],
    resourceAllocations: [
      { id: 'ra-1', teamId: 'team-1', monthlyRate: 12000, startDate: '2024-01-01' },
      { id: 'ra-2', teamId: 'team-3', monthlyRate: 8000, startDate: '2024-01-01' },
    ],
    deliverables: [
      { id: 'd1', title: 'Brand Style Guide', isCompleted: true },
      { id: 'd2', title: 'New E-commerce Platform', isCompleted: false },
    ],
    assignedTeamIds: ['team-1', 'team-3'],
    clientId: 'client-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'Secure-Gate Expansion',
    description: 'Infrastructure scaling and security hardening for enterprise clients.',
    status: ProjectStatus.ACTIVE,
    startDate: '2024-02-15',
    endDate: '2024-12-31',
    budgetAllocated: 250000,
    budgetSpent: 50000,
    currency: 'USD',
    expenses: [
      { 
        id: 'e3', 
        category: 'Security Hardware', 
        amount: 50000, 
        date: '2024-03-01', 
        description: 'Enterprise SSD Arrays',
        createdAt: '2024-03-01T00:00:00Z',
      }
    ],
    resourceAllocations: [
      { id: 'ra-3', teamId: 'team-2', monthlyRate: 25000, startDate: '2024-02-15' },
    ],
    deliverables: [
      { id: 'd3', title: 'VPC Overhaul', isCompleted: true },
      { id: 'd4', title: 'Security Audit Report', isCompleted: false },
    ],
    assignedTeamIds: ['team-2'],
    clientId: 'client-1',
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  }
];

export const mockTaskGroups: TaskGroup[] = [
  { 
    id: 'group-1', 
    projectId: 'proj-1', 
    name: 'Visual Identity',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  { 
    id: 'group-2', 
    projectId: 'proj-1', 
    name: 'Web Development',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    groupId: 'group-1',
    title: 'Logo Redesign',
    description: 'Create 3 variations of the new logo.',
    status: TaskStatus.DONE,
    priority: Priority.HIGH,
    assigneeTeamId: 'team-3',
    startDate: '2024-01-05',
    endDate: '2024-01-20',
    dependencies: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    completedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    groupId: 'group-1',
    title: 'Color Palette Selection',
    description: 'Define secondary and tertiary brand colors.',
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    assigneeTeamId: 'team-3',
    startDate: '2024-01-21',
    endDate: '2024-02-05',
    dependencies: ['task-1'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-21T00:00:00Z',
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    groupId: 'group-2',
    title: 'Hero Section UI',
    description: 'Implement the landing page hero with motion graphics.',
    status: TaskStatus.TODO,
    priority: Priority.HIGH,
    assigneeTeamId: 'team-1',
    startDate: '2024-02-10',
    endDate: '2024-02-25',
    dependencies: ['task-2'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
];

export const mockTickets: Ticket[] = [
  {
    id: 'tick-1',
    projectId: 'proj-1',
    title: 'Incorrect font on staging',
    description: 'The typography doesn\'t match the latest spec.',
    type: TicketType.ISSUE,
    status: TicketStatus.OPEN,
    priority: Priority.HIGH,
    reporterName: 'Sarah Jenkins',
    reporterEmail: 'sarah@global.com',
    createdAt: '2024-02-10T14:30:00Z',
    updatedAt: '2024-02-10T14:30:00Z',
  }
];
