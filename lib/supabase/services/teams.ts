/**
 * Teams Service
 * 
 * CRUD operations for teams using Supabase.
 * Handles team membership management.
 * 
 * @module lib/supabase/services/teams
 */

import { supabase } from '../client';
import type { Team, CreateTeamPayload, UpdateTeamPayload, TeamMember } from '../../../core/models/Team';

/**
 * Get all teams
 * 
 * Returns teams based on user's access:
 * - Admins: All teams
 * - Team members: Teams they belong to or teams assigned to their projects
 * 
 * @returns Array of teams
 */
export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      members:team_members(
        profile:profiles(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }

  return (data || []).map(transformTeam);
}

/**
 * Get a single team by ID
 * 
 * @param teamId Team ID
 * @returns Team or null if not found
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      members:team_members(
        profile:profiles(*)
      )
    `)
    .eq('id', teamId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching team:', error);
    throw error;
  }

  return data ? transformTeam(data) : null;
}

/**
 * Create a new team
 * 
 * Business Rules:
 * - Team must have at least one member (enforced at application level)
 * 
 * @param payload Team creation data
 * @returns Created team
 */
export async function createTeam(payload: CreateTeamPayload): Promise<Team> {
  // Create team
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .insert({
      name: payload.name,
      description: payload.description,
    })
    .select()
    .single();

  if (teamError) {
    console.error('Error creating team:', teamError);
    throw teamError;
  }

  // Add members
  if (payload.members && payload.members.length > 0) {
    // First, we need to find or create profiles for the members
    // For now, assuming members have existing profiles
    // In production, you'd want to handle this more carefully
    
    const memberInserts = await Promise.all(
      payload.members.map(async (member) => {
        // Find profile by email
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', member.email)
          .single();

        if (profile) {
          return {
            team_id: teamData.id,
            profile_id: profile.id,
            role: member.role,
          };
        }
        return null;
      })
    );

    const validInserts = memberInserts.filter(Boolean);
    if (validInserts.length > 0) {
      await supabase.from('team_members').insert(validInserts);
    }
  }

  return getTeamById(teamData.id) as Promise<Team>;
}

/**
 * Update an existing team
 * 
 * @param teamId Team ID
 * @param updates Partial team updates
 * @returns Updated team
 */
export async function updateTeam(
  teamId: string,
  updates: UpdateTeamPayload
): Promise<Team> {
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;

  const { data, error } = await supabase
    .from('teams')
    .update(updateData)
    .eq('id', teamId)
    .select(`
      *,
      members:team_members(
        profile:profiles(*)
      )
    `)
    .single();

  if (error) {
    console.error('Error updating team:', error);
    throw error;
  }

  return transformTeam(data);
}

/**
 * Delete a team
 * 
 * Business Rules:
 * - Cannot delete if assigned to projects or tasks (enforced at application level)
 * - Only admins can delete teams
 * 
 * @param teamId Team ID
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId);

  if (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
}

/**
 * Add a member to a team
 * 
 * @param teamId Team ID
 * @param profileId Profile ID of the member to add
 * @param role Optional role within the team
 */
export async function addTeamMember(
  teamId: string,
  profileId: string,
  role?: string
): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      profile_id: profileId,
      role: role,
    });

  if (error) {
    console.error('Error adding team member:', error);
    throw error;
  }
}

/**
 * Remove a member from a team
 * 
 * @param teamId Team ID
 * @param profileId Profile ID of the member to remove
 */
export async function removeTeamMember(
  teamId: string,
  profileId: string
): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('profile_id', profileId);

  if (error) {
    console.error('Error removing team member:', error);
    throw error;
  }
}

/**
 * Transform Supabase team data to our Team model
 */
function transformTeam(data: any): Team {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    members: (data.members || []).map((m: any) => ({
      id: m.profile.id,
      name: m.profile.full_name || m.profile.email,
      email: m.profile.email,
      role: m.role || m.profile.role,
      avatarUrl: m.profile.avatar_url,
    })),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
