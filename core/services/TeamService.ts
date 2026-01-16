/**
 * Team Service
 * 
 * Business logic layer for team operations.
 * Handles team management and safe deletion.
 * 
 * @module core/services/TeamService
 */

import { Team, CreateTeamPayload, UpdateTeamPayload } from '../models/Team';
import { Project } from '../models/Project';
import { Task } from '../models/Task';

/**
 * Team service interface
 */
export interface ITeamService {
  /**
   * Create a new team
   */
  createTeam(payload: CreateTeamPayload): Team;
  
  /**
   * Update an existing team
   */
  updateTeam(teamId: string, updates: UpdateTeamPayload): Team;
  
  /**
   * Delete a team
   * Validates team is not assigned to any projects or tasks
   */
  deleteTeam(teamId: string, projects: Project[], tasks: Task[]): void;
  
  /**
   * Check if team can be safely deleted
   */
  canDeleteTeam(teamId: string, projects: Project[], tasks: Task[]): { canDelete: boolean; reason?: string };
  
  /**
   * Get all projects assigned to a team
   */
  getTeamProjects(teamId: string, projects: Project[]): Project[];
  
  /**
   * Get all tasks assigned to a team
   */
  getTeamTasks(teamId: string, tasks: Task[]): Task[];
}

/**
 * Team Service Implementation
 */
export class TeamService implements ITeamService {
  /**
   * Create a new team
   * 
   * Business rules:
   * - Team must have at least one member
   * - Team name must be unique (would be validated at repository level)
   * 
   * @param payload Team creation data
   * @returns Created team entity
   */
  createTeam(payload: CreateTeamPayload): Team {
    if (!payload.members || payload.members.length === 0) {
      throw new Error('Team must have at least one member');
    }
    
    const now = new Date().toISOString();
    
    return {
      id: this.generateId(),
      name: payload.name,
      description: payload.description,
      members: payload.members.map(member => ({
        id: this.generateMemberId(),
        ...member,
      })),
      createdAt: now,
      updatedAt: now,
    };
  }
  
  /**
   * Update an existing team
   * 
   * Business rules:
   * - Cannot remove all members (team must have at least one)
   * 
   * @param teamId ID of team to update
   * @param updates Partial team updates
   * @returns Updated team
   */
  updateTeam(teamId: string, updates: UpdateTeamPayload): Team {
    // This would fetch from repository
    const team = updates as Team;
    
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }
    
    // Validate members if being updated
    if (updates.members !== undefined) {
      if (updates.members.length === 0) {
        throw new Error('Team must have at least one member');
      }
    }
    
    return {
      ...team,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Delete a team
   * 
   * Business rules:
   * - Team must not be assigned to any projects
   * - Team must not be assigned to any tasks
   * 
   * @param teamId ID of team to delete
   * @param projects All projects (to check assignments)
   * @param tasks All tasks (to check assignments)
   */
  deleteTeam(teamId: string, projects: Project[], tasks: Task[]): void {
    const canDelete = this.canDeleteTeam(teamId, projects, tasks);
    
    if (!canDelete.canDelete) {
      throw new Error(canDelete.reason || 'Cannot delete team');
    }
    
    // In a real implementation, this would delete from repository
    // and remove team references from projects and tasks
  }
  
  /**
   * Check if team can be safely deleted
   * 
   * Validates that team is not assigned to any projects or tasks.
   * 
   * @param teamId ID of team to check
   * @param projects All projects
   * @param tasks All tasks
   * @returns Deletion check result
   */
  canDeleteTeam(teamId: string, projects: Project[], tasks: Task[]): { canDelete: boolean; reason?: string } {
    // Check project assignments
    const assignedProjects = this.getTeamProjects(teamId, projects);
    if (assignedProjects.length > 0) {
      return {
        canDelete: false,
        reason: `Team is assigned to ${assignedProjects.length} project(s). Remove assignments first.`,
      };
    }
    
    // Check task assignments
    const assignedTasks = this.getTeamTasks(teamId, tasks);
    if (assignedTasks.length > 0) {
      return {
        canDelete: false,
        reason: `Team is assigned to ${assignedTasks.length} task(s). Remove assignments first.`,
      };
    }
    
    return { canDelete: true };
  }
  
  /**
   * Get all projects assigned to a team
   * 
   * @param teamId ID of team
   * @param projects All projects
   * @returns Array of projects assigned to the team
   */
  getTeamProjects(teamId: string, projects: Project[]): Project[] {
    return projects.filter(project => 
      project.assignedTeamIds.includes(teamId) ||
      project.resourceAllocations.some(ra => ra.teamId === teamId)
    );
  }
  
  /**
   * Get all tasks assigned to a team
   * 
   * @param teamId ID of team
   * @param tasks All tasks
   * @returns Array of tasks assigned to the team
   */
  getTeamTasks(teamId: string, tasks: Task[]): Task[] {
    return tasks.filter(task => task.assigneeTeamId === teamId);
  }
  
  /**
   * Generate a unique team ID
   */
  private generateId(): string {
    return `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate a unique member ID
   */
  private generateMemberId(): string {
    return `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const teamService = new TeamService();
