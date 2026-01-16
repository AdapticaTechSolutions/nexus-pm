/**
 * Team Repository
 * 
 * Data access layer for teams.
 * Handles CRUD operations and data persistence.
 * 
 * @module data/repositories/TeamRepository
 */

import { Team } from '../../core/models/Team';
import { TeamService } from '../../core/services/TeamService';

/**
 * Team repository interface
 */
export interface ITeamRepository {
  /**
   * Get all teams
   */
  getAll(): Team[];
  
  /**
   * Get team by ID
   */
  getById(id: string): Team | undefined;
  
  /**
   * Create a new team
   */
  create(team: Team): Team;
  
  /**
   * Update an existing team
   */
  update(id: string, updates: Partial<Team>): Team;
  
  /**
   * Delete a team
   */
  delete(id: string, projects: any[], tasks: any[]): void;
  
  /**
   * Check if team exists
   */
  exists(id: string): boolean;
}

/**
 * In-memory team repository implementation
 */
export class TeamRepository implements ITeamRepository {
  private teams: Map<string, Team> = new Map();
  private teamService: TeamService;
  
  constructor(teamService: TeamService) {
    this.teamService = teamService;
  }
  
  initialize(teams: Team[]): void {
    this.teams.clear();
    teams.forEach(team => {
      this.teams.set(team.id, team);
    });
  }
  
  getAll(): Team[] {
    return Array.from(this.teams.values());
  }
  
  getById(id: string): Team | undefined {
    return this.teams.get(id);
  }
  
  create(team: Team): Team {
    if (this.teams.has(team.id)) {
      throw new Error(`Team with ID ${team.id} already exists`);
    }
    
    this.teams.set(team.id, team);
    return team;
  }
  
  update(id: string, updates: Partial<Team>): Team {
    const existing = this.teams.get(id);
    if (!existing) {
      throw new Error(`Team ${id} not found`);
    }
    
    const updated = this.teamService.updateTeam(id, updates);
    this.teams.set(id, updated);
    return updated;
  }
  
  delete(id: string, projects: any[], tasks: any[]): void {
    const team = this.teams.get(id);
    if (!team) {
      throw new Error(`Team ${id} not found`);
    }
    
    // Validate deletion using service
    this.teamService.deleteTeam(id, projects, tasks);
    this.teams.delete(id);
  }
  
  exists(id: string): boolean {
    return this.teams.has(id);
  }
}
