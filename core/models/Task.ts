/**
 * Core Domain Model: Task
 * 
 * Represents a task entity with workflow, dependencies, and assignment.
 * Tasks can exist independently or as part of a task group/epic.
 * 
 * @module core/models/Task
 */

/**
 * Task status values
 * These represent the workflow states a task can be in.
 * The workflow is configurable per project/workspace.
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  REVIEW = 'review',
  BLOCKED = 'blocked',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

/**
 * Task priority levels
 * Used for sorting, filtering, and visual indicators
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Task entity
 * 
 * Represents a single unit of work within a project.
 * Tasks can have dependencies on other tasks, forming a directed acyclic graph (DAG).
 */
export interface Task {
  id: string;
  projectId: string;
  
  // Grouping
  groupId?: string; // Optional parent task group/epic
  
  // Basic properties
  title: string;
  description: string;
  
  // Workflow
  status: TaskStatus;
  priority: Priority;
  
  // Assignment
  assigneeTeamId?: string;
  assigneeMemberIds?: string[]; // Individual team members assigned
  
  // Timeline
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  dueDate?: string; // ISO date string - can differ from endDate
  
  // Dependencies
  dependencies: string[]; // Array of task IDs that must be completed first
  
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  createdBy?: string; // User ID
  completedAt?: string; // ISO timestamp - when task was marked as done
}

/**
 * Task group / Epic
 * 
 * A collection of related tasks grouped together for organizational purposes.
 * Useful for breaking down large features into manageable pieces.
 */
export interface TaskGroup {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  
  // Optional grouping hierarchy
  parentGroupId?: string; // For nested groups
  
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Milestone marker
 * 
 * Represents a significant point in the project timeline.
 * Milestones are typically tied to deliverables or major project phases.
 */
export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  targetDate: string; // ISO date string
  isCompleted: boolean;
  completedDate?: string; // ISO timestamp
  linkedDeliverableIds?: string[]; // Deliverables that must be completed for this milestone
  linkedTaskIds?: string[]; // Tasks that should be completed by this milestone
  
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Task creation payload
 */
export interface CreateTaskPayload {
  projectId: string;
  groupId?: string;
  title: string;
  description: string;
  status?: TaskStatus;
  priority: Priority;
  assigneeTeamId?: string;
  assigneeMemberIds?: string[];
  startDate: string;
  endDate: string;
  dueDate?: string;
  dependencies?: string[];
}

/**
 * Task update payload
 */
export type UpdateTaskPayload = Partial<Omit<Task, 'id' | 'projectId' | 'createdAt' | 'createdBy'>>;

/**
 * Task group creation payload
 */
export interface CreateTaskGroupPayload {
  projectId: string;
  name: string;
  description?: string;
  parentGroupId?: string;
}
