/**
 * Task Service
 * 
 * Business logic layer for task operations.
 * Handles task lifecycle, dependencies, and workflow transitions.
 * 
 * @module core/services/TaskService
 */

import { Task, TaskGroup, CreateTaskPayload, UpdateTaskPayload, TaskStatus, CreateTaskGroupPayload } from '../models/Task';
import { getAppConfig } from '../../config/AppConfig';

/**
 * Task service interface
 */
export interface ITaskService {
  /**
   * Create a new task
   */
  createTask(payload: CreateTaskPayload): Task;
  
  /**
   * Update an existing task
   */
  updateTask(taskId: string, updates: UpdateTaskPayload): Task;
  
  /**
   * Delete a task
   * Validates no other tasks depend on it
   */
  deleteTask(taskId: string, allTasks: Task[]): void;
  
  /**
   * Create a task group/epic
   */
  createTaskGroup(payload: CreateTaskGroupPayload): TaskGroup;
  
  /**
   * Update task status
   * Validates workflow transitions
   */
  updateTaskStatus(task: Task, newStatus: TaskStatus, allTasks: Task[]): Task;
  
  /**
   * Validate task dependencies
   * Ensures no circular dependencies and that dependencies exist
   */
  validateDependencies(task: Task, allTasks: Task[]): { valid: boolean; errors: string[] };
  
  /**
   * Check if task can transition to new status
   */
  canTransitionStatus(currentStatus: TaskStatus, newStatus: TaskStatus): boolean;
  
  /**
   * Get tasks that depend on this task
   */
  getDependentTasks(taskId: string, allTasks: Task[]): Task[];
}

/**
 * Task Service Implementation
 */
export class TaskService implements ITaskService {
  /**
   * Create a new task
   * 
   * Business rules:
   * - Validates dates
   * - Sets default status if not provided
   * - Validates dependencies exist
   * 
   * @param payload Task creation data
   * @returns Created task entity
   */
  createTask(payload: CreateTaskPayload): Task {
    const config = getAppConfig();
    
    // Validate dates
    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }
    
    // Validate due date if provided
    if (payload.dueDate) {
      const dueDate = new Date(payload.dueDate);
      if (dueDate < startDate) {
        throw new Error('Due date cannot be before start date');
      }
    }
    
    const now = new Date().toISOString();
    
    return {
      id: this.generateId(),
      projectId: payload.projectId,
      groupId: payload.groupId,
      title: payload.title,
      description: payload.description,
      status: payload.status || (config.taskWorkflow.defaultStatus as TaskStatus),
      priority: payload.priority,
      assigneeTeamId: payload.assigneeTeamId,
      assigneeMemberIds: payload.assigneeMemberIds,
      startDate: payload.startDate,
      endDate: payload.endDate,
      dueDate: payload.dueDate,
      dependencies: payload.dependencies || [],
      createdAt: now,
      updatedAt: now,
    };
  }
  
  /**
   * Update an existing task
   * 
   * Business rules:
   * - Validates status transitions
   * - Validates date changes
   * - Updates completion timestamp if status changes to DONE
   * 
   * @param taskId ID of task to update
   * @param updates Partial task updates
   * @returns Updated task
   */
  updateTask(taskId: string, updates: UpdateTaskPayload): Task {
    // This would fetch from repository
    const task = updates as Task;
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    // Validate status transition if status is being updated
    if (updates.status && updates.status !== task.status) {
      if (!this.canTransitionStatus(task.status, updates.status)) {
        throw new Error(`Cannot transition from ${task.status} to ${updates.status}`);
      }
    }
    
    // Validate dates
    const startDate = updates.startDate ? new Date(updates.startDate) : new Date(task.startDate);
    const endDate = updates.endDate ? new Date(updates.endDate) : new Date(task.endDate);
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }
    
    // Set completion timestamp if status changes to DONE
    const newStatus = updates.status || task.status;
    const completedAt = newStatus === TaskStatus.DONE && task.status !== TaskStatus.DONE
      ? new Date().toISOString()
      : task.completedAt;
    
    return {
      ...task,
      ...updates,
      completedAt,
      updatedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Delete a task
   * 
   * Business rules:
   * - Cannot delete if other tasks depend on it
   * - Removes task from dependencies of other tasks
   * 
   * @param taskId ID of task to delete
   * @param allTasks All tasks in the system (to check dependencies)
   */
  deleteTask(taskId: string, allTasks: Task[]): void {
    const dependentTasks = this.getDependentTasks(taskId, allTasks);
    
    if (dependentTasks.length > 0) {
      throw new Error(
        `Cannot delete task: ${dependentTasks.length} task(s) depend on it. ` +
        `Remove dependencies first or delete dependent tasks.`
      );
    }
    
    // In a real implementation, this would delete from repository
    // and update all tasks that have this task in their dependencies
  }
  
  /**
   * Create a task group/epic
   * 
   * @param payload Task group creation data
   * @returns Created task group
   */
  createTaskGroup(payload: CreateTaskGroupPayload): TaskGroup {
    const now = new Date().toISOString();
    
    return {
      id: this.generateId(),
      projectId: payload.projectId,
      name: payload.name,
      description: payload.description,
      parentGroupId: payload.parentGroupId,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  /**
   * Update task status
   * 
   * Validates workflow transitions and updates task.
   * 
   * @param task Task to update
   * @param newStatus New status to transition to
   * @param allTasks All tasks (for dependency validation)
   * @returns Updated task
   */
  updateTaskStatus(task: Task, newStatus: TaskStatus, allTasks: Task[]): Task {
    if (!this.canTransitionStatus(task.status, newStatus)) {
      throw new Error(`Cannot transition from ${task.status} to ${newStatus}`);
    }
    
    // If transitioning to DONE, validate all dependencies are complete
    if (newStatus === TaskStatus.DONE) {
      const incompleteDependencies = task.dependencies.filter(depId => {
        const depTask = allTasks.find(t => t.id === depId);
        return !depTask || depTask.status !== TaskStatus.DONE;
      });
      
      if (incompleteDependencies.length > 0) {
        throw new Error(
          `Cannot mark task as done: ${incompleteDependencies.length} dependency(ies) not completed`
        );
      }
    }
    
    return this.updateTask(task.id, {
      status: newStatus,
      completedAt: newStatus === TaskStatus.DONE ? new Date().toISOString() : undefined,
    });
  }
  
  /**
   * Validate task dependencies
   * 
   * Checks:
   * - All dependency IDs exist
   * - No circular dependencies
   * - Dependencies are in the same project
   * 
   * @param task Task to validate
   * @param allTasks All tasks in the system
   * @returns Validation result
   */
  validateDependencies(task: Task, allTasks: Task[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check all dependencies exist
    for (const depId of task.dependencies) {
      const depTask = allTasks.find(t => t.id === depId);
      if (!depTask) {
        errors.push(`Dependency ${depId} not found`);
      } else if (depTask.projectId !== task.projectId) {
        errors.push(`Dependency ${depId} is in a different project`);
      }
    }
    
    // Check for circular dependencies
    if (this.hasCircularDependency(task.id, task.dependencies, allTasks)) {
      errors.push('Circular dependency detected');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Check for circular dependencies using DFS
   * 
   * @param taskId Starting task ID
   * @param dependencies Initial dependencies to check
   * @param allTasks All tasks
   * @returns True if circular dependency exists
   */
  private hasCircularDependency(taskId: string, dependencies: string[], allTasks: Task[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const dfs = (currentId: string): boolean => {
      if (recursionStack.has(currentId)) {
        return true; // Circular dependency found
      }
      
      if (visited.has(currentId)) {
        return false; // Already checked, no cycle
      }
      
      visited.add(currentId);
      recursionStack.add(currentId);
      
      const task = allTasks.find(t => t.id === currentId);
      if (task) {
        for (const depId of task.dependencies) {
          if (dfs(depId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(currentId);
      return false;
    };
    
    for (const depId of dependencies) {
      if (dfs(depId)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if task can transition to new status
   * 
   * Uses workflow configuration to determine valid transitions.
   * 
   * @param currentStatus Current task status
   * @param newStatus Desired new status
   * @returns True if transition is allowed
   */
  canTransitionStatus(currentStatus: TaskStatus, newStatus: TaskStatus): boolean {
    if (currentStatus === newStatus) {
      return true; // No-op transition
    }
    
    const config = getAppConfig();
    const allowedTransitions = config.taskWorkflow.transitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }
  
  /**
   * Get tasks that depend on this task
   * 
   * @param taskId ID of task to check
   * @param allTasks All tasks in the system
   * @returns Array of tasks that depend on this task
   */
  getDependentTasks(taskId: string, allTasks: Task[]): Task[] {
    return allTasks.filter(task => task.dependencies.includes(taskId));
  }
  
  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const taskService = new TaskService();
