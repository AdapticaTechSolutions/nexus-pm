/**
 * Project Repository
 * 
 * Data access layer for projects.
 * Handles CRUD operations and data persistence.
 * 
 * In a production system, this would interface with a database.
 * For now, it uses in-memory storage.
 * 
 * @module data/repositories/ProjectRepository
 */

import { Project } from '../../core/models/Project';
import { ProjectService } from '../../core/services/ProjectService';

/**
 * Project repository interface
 * Defines the contract for project data access
 */
export interface IProjectRepository {
  /**
   * Get all projects
   */
  getAll(): Project[];
  
  /**
   * Get project by ID
   */
  getById(id: string): Project | undefined;
  
  /**
   * Get projects by status
   */
  getByStatus(status: string): Project[];
  
  /**
   * Get projects by client ID
   */
  getByClientId(clientId: string): Project[];
  
  /**
   * Create a new project
   */
  create(project: Project): Project;
  
  /**
   * Update an existing project
   */
  update(id: string, updates: Partial<Project>): Project;
  
  /**
   * Delete a project
   */
  delete(id: string): void;
  
  /**
   * Check if project exists
   */
  exists(id: string): boolean;
}

/**
 * In-memory project repository implementation
 * 
 * This is a simple implementation for demonstration.
 * In production, this would connect to a database.
 */
export class ProjectRepository implements IProjectRepository {
  private projects: Map<string, Project> = new Map();
  private projectService: ProjectService;
  
  constructor(projectService: ProjectService) {
    this.projectService = projectService;
  }
  
  /**
   * Initialize repository with existing projects
   * Useful for loading from mock data or database
   */
  initialize(projects: Project[]): void {
    this.projects.clear();
    projects.forEach(project => {
      this.projects.set(project.id, project);
    });
  }
  
  getAll(): Project[] {
    return Array.from(this.projects.values());
  }
  
  getById(id: string): Project | undefined {
    return this.projects.get(id);
  }
  
  getByStatus(status: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.status === status);
  }
  
  getByClientId(clientId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.clientId === clientId);
  }
  
  create(project: Project): Project {
    if (this.projects.has(project.id)) {
      throw new Error(`Project with ID ${project.id} already exists`);
    }
    
    this.projects.set(project.id, project);
    return project;
  }
  
  update(id: string, updates: Partial<Project>): Project {
    const existing = this.projects.get(id);
    if (!existing) {
      throw new Error(`Project ${id} not found`);
    }
    
    const updated = this.projectService.updateProject(id, updates);
    this.projects.set(id, updated);
    return updated;
  }
  
  delete(id: string): Project {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error(`Project ${id} not found`);
    }
    
    // Validate deletion
    if (!this.projectService.canDeleteProject(project)) {
      throw new Error('Project must be archived before deletion');
    }
    
    this.projects.delete(id);
    return project;
  }
  
  exists(id: string): boolean {
    return this.projects.has(id);
  }
}
