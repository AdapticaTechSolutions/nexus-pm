/**
 * Core Domain Model: Project
 * 
 * Represents a project entity with all its business properties.
 * This is the source of truth for project data structure.
 * 
 * @module core/models/Project
 */

import { CurrencyCode } from '../../types';

/**
 * Project status lifecycle
 * - active: Project is currently in progress
 * - archived: Project is completed or cancelled, kept for historical reference
 * - draft: Project is being planned but not yet started
 */
export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

/**
 * Expected deliverable for a project
 * Tracks what the client expects to receive upon project completion
 */
export interface Deliverable {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string; // ISO date string
  completedDate?: string; // ISO date string
}

/**
 * Budget expense entry
 * Represents a manual expense recorded against the project budget
 */
export interface BudgetExpense {
  id: string;
  category: string;
  amount: number;
  date: string; // ISO date string
  description: string;
  createdBy?: string; // User ID who created this expense
  createdAt: string; // ISO timestamp
}

/**
 * Resource allocation for a team on a project
 * Tracks monthly billing rate and allocation period
 */
export interface ResourceAllocation {
  id: string;
  teamId: string;
  monthlyRate: number;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string - if not set, allocation is ongoing
  notes?: string;
}

/**
 * Project entity
 * 
 * Core business object representing a project with all its attributes.
 * This model enforces business rules at the type level.
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  
  // Timeline
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  
  // Budget tracking
  budgetAllocated: number;
  budgetSpent: number; // Manual expenses only (excludes accrued resource costs)
  currency: CurrencyCode;
  expenses: BudgetExpense[];
  resourceAllocations: ResourceAllocation[];
  
  // Deliverables
  deliverables: Deliverable[];
  
  // Team assignments
  assignedTeamIds: string[];
  
  // Client relationship
  clientId: string;
  
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  createdBy?: string; // User ID
  archivedAt?: string; // ISO timestamp - when project was archived
}

/**
 * Project creation payload
 * Used when creating a new project (excludes auto-generated fields)
 */
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

/**
 * Project update payload
 * Allows partial updates to project properties
 */
export type UpdateProjectPayload = Partial<Omit<Project, 'id' | 'createdAt' | 'createdBy'>>;
