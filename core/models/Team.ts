/**
 * Core Domain Model: Team
 * 
 * Represents a team entity with members and assignments.
 * Teams can be assigned to projects, task groups, or individual tasks.
 * 
 * @module core/models/Team
 */

/**
 * Team member entity
 * Represents an individual team member
 */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role?: string; // e.g., "Developer", "Designer", "PM"
  avatarUrl?: string;
}

/**
 * Team entity
 * 
 * A collection of team members working together.
 * Teams can be assigned to multiple projects and tasks.
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Team creation payload
 */
export interface CreateTeamPayload {
  name: string;
  description?: string;
  members: Omit<TeamMember, 'id'>[];
}

/**
 * Team update payload
 */
export type UpdateTeamPayload = Partial<Omit<Team, 'id' | 'createdAt'>>;
