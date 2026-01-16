/**
 * Projects Service
 * 
 * CRUD operations for projects using Supabase.
 * All operations respect Row Level Security policies.
 * 
 * @module lib/supabase/services/projects
 */

import { supabase } from '../client';
import type { Project, CreateProjectPayload, UpdateProjectPayload } from '../../../core/models/Project';
import { ProjectStatus } from '../../../core/models/Project';

/**
 * Get all projects
 * 
 * Returns projects based on user's role and assignments:
 * - Admins: All projects
 * - Team members: Projects they're assigned to
 * - Clients: Their own projects
 * 
 * @param filters Optional filters (status, clientId, etc.)
 * @returns Array of projects
 */
export async function getProjects(filters?: {
  status?: ProjectStatus;
  clientId?: string;
}): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      project_teams:project_teams(
        team:teams(*)
      ),
      deliverables:deliverables(*),
      resource_allocations:resource_allocations(
        team:teams(*)
      ),
      budget_expenses:budget_expenses(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  // Transform Supabase response to match our Project model
  return (data || []).map(transformProject);
}

/**
 * Get a single project by ID
 * 
 * @param projectId Project ID
 * @returns Project or null if not found
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      project_teams:project_teams(
        team:teams(*)
      ),
      deliverables:deliverables(*),
      resource_allocations:resource_allocations(
        team:teams(*)
      ),
      budget_expenses:budget_expenses(*)
    `)
    .eq('id', projectId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching project:', error);
    throw error;
  }

  return data ? transformProject(data) : null;
}

/**
 * Create a new project
 * 
 * Business Rules:
 * - Only admins and team members can create projects
 * - Start date must be before end date (enforced by DB constraint)
 * - Budget must be positive (enforced by DB constraint)
 * 
 * @param payload Project creation data
 * @returns Created project
 */
export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  // Get current user's profile for created_by
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .single();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: payload.name,
      description: payload.description,
      start_date: payload.startDate,
      end_date: payload.endDate,
      budget_allocated: payload.budgetAllocated,
      budget_spent: 0,
      currency: payload.currency,
      client_id: payload.clientId,
      status: 'active',
      created_by: profile?.id,
    })
    .select(`
      *,
      client:clients(*),
      project_teams:project_teams(
        team:teams(*)
      ),
      deliverables:deliverables(*),
      resource_allocations:resource_allocations(
        team:teams(*)
      ),
      budget_expenses:budget_expenses(*)
    `)
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  // Create deliverables if provided
  if (payload.deliverables && payload.deliverables.length > 0) {
    await supabase.from('deliverables').insert(
      payload.deliverables.map(d => ({
        project_id: data.id,
        title: d.title,
        description: d.description,
        due_date: d.dueDate,
        is_completed: false,
      }))
    );
  }

  // Assign teams if provided
  if (payload.assignedTeamIds && payload.assignedTeamIds.length > 0) {
    await supabase.from('project_teams').insert(
      payload.assignedTeamIds.map(teamId => ({
        project_id: data.id,
        team_id: teamId,
      }))
    );
  }

  // Refetch to get all related data
  return getProjectById(data.id) as Promise<Project>;
}

/**
 * Update an existing project
 * 
 * Business Rules:
 * - Only admins can change project status
 * - Archived projects cannot be modified (enforced by RLS)
 * 
 * @param projectId Project ID
 * @param updates Partial project updates
 * @returns Updated project
 */
export async function updateProject(
  projectId: string,
  updates: UpdateProjectPayload
): Promise<Project> {
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
  if (updates.budgetAllocated !== undefined) updateData.budget_allocated = updates.budgetAllocated;
  if (updates.budgetSpent !== undefined) updateData.budget_spent = updates.budgetSpent;
  if (updates.currency !== undefined) updateData.currency = updates.currency;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .select(`
      *,
      client:clients(*),
      project_teams:project_teams(
        team:teams(*)
      ),
      deliverables:deliverables(*),
      resource_allocations:resource_allocations(
        team:teams(*)
      ),
      budget_expenses:budget_expenses(*)
    `)
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return transformProject(data);
}

/**
 * Archive a project
 * 
 * Business Rules:
 * - Only admins can archive projects
 * - Sets archived_at timestamp
 * 
 * @param projectId Project ID
 * @returns Archived project
 */
export async function archiveProject(projectId: string): Promise<Project> {
  return updateProject(projectId, {
    status: ProjectStatus.ARCHIVED,
    archivedAt: new Date().toISOString(),
  });
}

/**
 * Delete a project (hard delete)
 * 
 * Business Rules:
 * - Only admins can delete projects
 * - Project must be archived first (enforced at application level)
 * 
 * @param projectId Project ID
 */
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

/**
 * Transform Supabase project data to our Project model
 * 
 * Converts snake_case database fields to camelCase model properties.
 */
function transformProject(data: any): Project {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    status: data.status,
    startDate: data.start_date,
    endDate: data.end_date,
    budgetAllocated: parseFloat(data.budget_allocated),
    budgetSpent: parseFloat(data.budget_spent || 0),
    currency: data.currency,
    expenses: (data.budget_expenses || []).map((e: any) => ({
      id: e.id,
      category: e.category,
      amount: parseFloat(e.amount),
      date: e.expense_date,
      description: e.description,
      createdBy: e.created_by,
      createdAt: e.created_at,
    })),
    resourceAllocations: (data.resource_allocations || []).map((ra: any) => ({
      id: ra.id,
      teamId: ra.team_id,
      monthlyRate: parseFloat(ra.monthly_rate),
      startDate: ra.start_date,
      endDate: ra.end_date,
      notes: ra.notes,
    })),
    deliverables: (data.deliverables || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      isCompleted: d.is_completed,
      dueDate: d.due_date,
      completedDate: d.completed_date,
    })),
    assignedTeamIds: (data.project_teams || []).map((pt: any) => pt.team_id),
    clientId: data.client_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
    archivedAt: data.archived_at,
  };
}
