/**
 * Project Service
 * 
 * Business logic layer for project operations.
 * Handles project lifecycle, validation, and business rules.
 * 
 * @module core/services/ProjectService
 */

import { Project, CreateProjectPayload, UpdateProjectPayload, ProjectStatus } from '../models/Project';
import { Task } from '../models/Task';

/**
 * Project service interface
 * Defines the contract for project operations
 */
export interface IProjectService {
  /**
   * Create a new project
   * Validates input and applies business rules
   */
  createProject(payload: CreateProjectPayload): Project;
  
  /**
   * Update an existing project
   * Validates updates and enforces business rules
   */
  updateProject(projectId: string, updates: UpdateProjectPayload): Project;
  
  /**
   * Archive a project
   * Marks project as archived and prevents further modifications
   */
  archiveProject(projectId: string): Project;
  
  /**
   * Remove a project permanently
   * Validates that project can be safely deleted
   */
  removeProject(projectId: string): void;
  
  /**
   * Calculate total project spend
   * Includes manual expenses and accrued resource costs
   */
  calculateTotalSpend(project: Project): number;
  
  /**
   * Calculate remaining budget
   */
  calculateRemainingBudget(project: Project): number;
  
  /**
   * Validate project dates
   * Ensures start date is before end date
   */
  validateProjectDates(startDate: string, endDate: string): boolean;
  
  /**
   * Check if project can be archived
   * Business rule: Project must be active to be archived
   */
  canArchiveProject(project: Project): boolean;
  
  /**
   * Check if project can be deleted
   * Business rule: Project must be archived before deletion
   */
  canDeleteProject(project: Project): boolean;
}

/**
 * Project Service Implementation
 * 
 * Contains all business logic for project management.
 * This service is stateless and operates on project entities.
 */
export class ProjectService implements IProjectService {
  /**
   * Create a new project
   * 
   * Applies business rules:
   * - Validates dates
   * - Sets default status to ACTIVE
   * - Generates timestamps
   * 
   * @param payload Project creation data
   * @returns Created project entity
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
   * Update an existing project
   * 
   * Business rules:
   * - Cannot update archived projects
   * - Validates date changes
   * - Updates timestamp
   * 
   * @param projectId ID of project to update
   * @param updates Partial project updates
   * @returns Updated project
   */
  updateProject(projectId: string, updates: UpdateProjectPayload): Project {
    // This would typically fetch the project from repository
    // For now, we'll assume the project is passed in updates
    const project = updates as Project;
    
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    
    // Cannot update archived projects
    if (project.status === ProjectStatus.ARCHIVED) {
      throw new Error('Cannot update archived project');
    }
    
    // Validate dates if both are being updated
    if (updates.startDate && updates.endDate) {
      if (!this.validateProjectDates(updates.startDate, updates.endDate)) {
        throw new Error('Start date must be before end date');
      }
    } else if (updates.startDate && project.endDate) {
      if (!this.validateProjectDates(updates.startDate, project.endDate)) {
        throw new Error('Start date must be before end date');
      }
    } else if (updates.endDate && project.startDate) {
      if (!this.validateProjectDates(project.startDate, updates.endDate)) {
        throw new Error('Start date must be before end date');
      }
    }
    
    return {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Archive a project
   * 
   * Business rules:
   * - Only active projects can be archived
   * - Sets archived timestamp
   * - Changes status to ARCHIVED
   * 
   * @param projectId ID of project to archive
   * @returns Archived project
   */
  archiveProject(projectId: string): Project {
    // This would fetch from repository
    throw new Error('Method requires project repository - use repository pattern');
  }
  
  /**
   * Remove a project permanently
   * 
   * Business rules:
   * - Project must be archived first
   * - Validates no active dependencies
   * 
   * @param projectId ID of project to remove
   */
  removeProject(projectId: string): void {
    // This would validate and delete from repository
    throw new Error('Method requires project repository - use repository pattern');
  }
  
  /**
   * Calculate total project spend
   * 
   * Includes:
   * - Manual expenses (budgetSpent)
   * - Accrued resource allocation costs
   * 
   * @param project Project to calculate spend for
   * @returns Total spend amount
   */
  calculateTotalSpend(project: Project): number {
    const manualExpenses = project.budgetSpent || 0;
    
    // Calculate accrued resource costs
    const accruedResources = this.calculateAccruedResourceCosts(project);
    
    return manualExpenses + accruedResources;
  }
  
  /**
   * Calculate accrued resource allocation costs
   * 
   * Calculates costs based on monthly rates and elapsed time.
   * 
   * @param project Project with resource allocations
   * @returns Accrued cost amount
   */
  private calculateAccruedResourceCosts(project: Project): number {
    if (!project.resourceAllocations || project.resourceAllocations.length === 0) {
      return 0;
    }
    
    const now = new Date();
    const projectStart = new Date(project.startDate);
    
    return project.resourceAllocations.reduce((total, allocation) => {
      // Determine billing start date (allocation start or project start, whichever is later)
      const billingStart = new Date(
        new Date(allocation.startDate) > projectStart 
          ? allocation.startDate 
          : project.startDate
      );
      
      // Determine billing end date (allocation end, project end, or now, whichever is earliest)
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
      
      // Calculate elapsed months (fractional)
      if (billingEnd <= billingStart) {
        return total;
      }
      
      const years = billingEnd.getFullYear() - billingStart.getFullYear();
      const months = billingEnd.getMonth() - billingStart.getMonth();
      const days = billingEnd.getDate() - billingStart.getDate();
      const elapsedMonths = (years * 12) + months + (days / 30);
      
      return total + (elapsedMonths * allocation.monthlyRate);
    }, 0);
  }
  
  /**
   * Calculate remaining budget
   * 
   * @param project Project to calculate remaining budget for
   * @returns Remaining budget amount (can be negative if over budget)
   */
  calculateRemainingBudget(project: Project): number {
    const totalSpend = this.calculateTotalSpend(project);
    return project.budgetAllocated - totalSpend;
  }
  
  /**
   * Validate project dates
   * 
   * Ensures start date is before end date.
   * 
   * @param startDate Project start date (ISO string)
   * @param endDate Project end date (ISO string)
   * @returns True if dates are valid
   */
  validateProjectDates(startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  }
  
  /**
   * Check if project can be archived
   * 
   * Business rule: Only active projects can be archived.
   * 
   * @param project Project to check
   * @returns True if project can be archived
   */
  canArchiveProject(project: Project): boolean {
    return project.status === ProjectStatus.ACTIVE;
  }
  
  /**
   * Check if project can be deleted
   * 
   * Business rule: Project must be archived before deletion.
   * 
   * @param project Project to check
   * @returns True if project can be deleted
   */
  canDeleteProject(project: Project): boolean {
    return project.status === ProjectStatus.ARCHIVED;
  }
  
  /**
   * Generate a unique ID
   * 
   * In production, this would use a proper ID generator (UUID, etc.)
   * 
   * @returns Unique ID string
   */
  private generateId(): string {
    return `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
