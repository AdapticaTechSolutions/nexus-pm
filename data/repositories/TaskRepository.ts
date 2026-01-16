/**
 * Task Repository
 * 
 * Data access layer for tasks.
 * Handles CRUD operations and data persistence.
 * 
 * @module data/repositories/TaskRepository
 */

import { Task, TaskGroup } from '../../core/models/Task';
import { TaskService } from '../../core/services/TaskService';

/**
 * Task repository interface
 */
export interface ITaskRepository {
  /**
   * Get all tasks
   */
  getAll(): Task[];
  
  /**
   * Get task by ID
   */
  getById(id: string): Task | undefined;
  
  /**
   * Get tasks by project ID
   */
  getByProjectId(projectId: string): Task[];
  
  /**
   * Get tasks by group ID
   */
  getByGroupId(groupId: string): Task[];
  
  /**
   * Get tasks by status
   */
  getByStatus(status: string): Task[];
  
  /**
   * Create a new task
   */
  create(task: Task): Task;
  
  /**
   * Update an existing task
   */
  update(id: string, updates: Partial<Task>): Task;
  
  /**
   * Delete a task
   */
  delete(id: string): void;
  
  /**
   * Check if task exists
   */
  exists(id: string): boolean;
}

/**
 * Task Group repository interface
 */
export interface ITaskGroupRepository {
  /**
   * Get all task groups
   */
  getAll(): TaskGroup[];
  
  /**
   * Get task group by ID
   */
  getById(id: string): TaskGroup | undefined;
  
  /**
   * Get task groups by project ID
   */
  getByProjectId(projectId: string): TaskGroup[];
  
  /**
   * Create a new task group
   */
  create(group: TaskGroup): TaskGroup;
  
  /**
   * Update an existing task group
   */
  update(id: string, updates: Partial<TaskGroup>): TaskGroup;
  
  /**
   * Delete a task group
   */
  delete(id: string): void;
  
  /**
   * Check if task group exists
   */
  exists(id: string): boolean;
}

/**
 * In-memory task repository implementation
 */
export class TaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();
  private taskService: TaskService;
  
  constructor(taskService: TaskService) {
    this.taskService = taskService;
  }
  
  initialize(tasks: Task[]): void {
    this.tasks.clear();
    tasks.forEach(task => {
      this.tasks.set(task.id, task);
    });
  }
  
  getAll(): Task[] {
    return Array.from(this.tasks.values());
  }
  
  getById(id: string): Task | undefined {
    return this.tasks.get(id);
  }
  
  getByProjectId(projectId: string): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.projectId === projectId);
  }
  
  getByGroupId(groupId: string): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.groupId === groupId);
  }
  
  getByStatus(status: string): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }
  
  create(task: Task): Task {
    if (this.tasks.has(task.id)) {
      throw new Error(`Task with ID ${task.id} already exists`);
    }
    
    // Validate dependencies
    const validation = this.taskService.validateDependencies(task, this.getAll());
    if (!validation.valid) {
      throw new Error(`Invalid dependencies: ${validation.errors.join(', ')}`);
    }
    
    this.tasks.set(task.id, task);
    return task;
  }
  
  update(id: string, updates: Partial<Task>): Task {
    const existing = this.tasks.get(id);
    if (!existing) {
      throw new Error(`Task ${id} not found`);
    }
    
    const updated = this.taskService.updateTask(id, updates);
    
    // Re-validate dependencies if they changed
    if (updates.dependencies !== undefined) {
      const validation = this.taskService.validateDependencies(updated, this.getAll());
      if (!validation.valid) {
        throw new Error(`Invalid dependencies: ${validation.errors.join(', ')}`);
      }
    }
    
    this.tasks.set(id, updated);
    return updated;
  }
  
  delete(id: string): void {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }
    
    this.taskService.deleteTask(id, this.getAll());
    this.tasks.delete(id);
  }
  
  exists(id: string): boolean {
    return this.tasks.has(id);
  }
}

/**
 * In-memory task group repository implementation
 */
export class TaskGroupRepository implements ITaskGroupRepository {
  private groups: Map<string, TaskGroup> = new Map();
  
  initialize(groups: TaskGroup[]): void {
    this.groups.clear();
    groups.forEach(group => {
      this.groups.set(group.id, group);
    });
  }
  
  getAll(): TaskGroup[] {
    return Array.from(this.groups.values());
  }
  
  getById(id: string): TaskGroup | undefined {
    return this.groups.get(id);
  }
  
  getByProjectId(projectId: string): TaskGroup[] {
    return Array.from(this.groups.values()).filter(g => g.projectId === projectId);
  }
  
  create(group: TaskGroup): TaskGroup {
    if (this.groups.has(group.id)) {
      throw new Error(`Task group with ID ${group.id} already exists`);
    }
    
    this.groups.set(group.id, group);
    return group;
  }
  
  update(id: string, updates: Partial<TaskGroup>): TaskGroup {
    const existing = this.groups.get(id);
    if (!existing) {
      throw new Error(`Task group ${id} not found`);
    }
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.groups.set(id, updated);
    return updated;
  }
  
  delete(id: string): void {
    // In a real system, we'd check if any tasks reference this group
    if (!this.groups.has(id)) {
      throw new Error(`Task group ${id} not found`);
    }
    
    this.groups.delete(id);
  }
  
  exists(id: string): boolean {
    return this.groups.has(id);
  }
}
