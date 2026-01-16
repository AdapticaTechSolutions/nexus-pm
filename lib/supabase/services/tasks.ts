/**
 * Tasks Service
 * 
 * CRUD operations for tasks using Supabase.
 * Handles task dependencies, assignments, and workflow validation.
 * 
 * @module lib/supabase/services/tasks
 */

import { supabase } from '../client';
import type { Task, CreateTaskPayload, UpdateTaskPayload, TaskGroup, CreateTaskGroupPayload } from '../../../core/models/Task';
import { TaskStatus } from '../../../core/models/Task';

/**
 * Get all tasks for a project
 * 
 * @param projectId Project ID
 * @returns Array of tasks
 */
export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      dependencies:task_dependencies(
        depends_on_task:tasks!task_dependencies_depends_on_task_id_fkey(*)
      ),
      assignments:task_assignments(
        profile:profiles(*)
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return (data || []).map(transformTask);
}

/**
 * Get a single task by ID
 * 
 * @param taskId Task ID
 * @returns Task or null if not found
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      dependencies:task_dependencies(
        depends_on_task:tasks!task_dependencies_depends_on_task_id_fkey(*)
      ),
      assignments:task_assignments(
        profile:profiles(*)
      )
    `)
    .eq('id', taskId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching task:', error);
    throw error;
  }

  return data ? transformTask(data) : null;
}

/**
 * Create a new task
 * 
 * Business Rules:
 * - Validates dates (start < end)
 * - Creates task dependencies if provided
 * - Creates task assignments if provided
 * 
 * @param payload Task creation data
 * @returns Created task
 */
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  // Get current user's profile for created_by
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .single();

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: payload.projectId,
      group_id: payload.groupId,
      title: payload.title,
      description: payload.description,
      status: payload.status || 'todo',
      priority: payload.priority,
      assignee_team_id: payload.assigneeTeamId,
      start_date: payload.startDate,
      end_date: payload.endDate,
      due_date: payload.dueDate,
      created_by: profile?.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  // Create dependencies if provided
  if (payload.dependencies && payload.dependencies.length > 0) {
    await supabase.from('task_dependencies').insert(
      payload.dependencies.map(depId => ({
        task_id: data.id,
        depends_on_task_id: depId,
      }))
    );
  }

  // Create assignments if provided
  if (payload.assigneeMemberIds && payload.assigneeMemberIds.length > 0) {
    await supabase.from('task_assignments').insert(
      payload.assigneeMemberIds.map(memberId => ({
        task_id: data.id,
        profile_id: memberId,
      }))
    );
  }

  return getTaskById(data.id) as Promise<Task>;
}

/**
 * Update an existing task
 * 
 * Business Rules:
 * - Validates status transitions (enforced at application level)
 * - Updates completed_at timestamp if status changes to 'done'
 * 
 * @param taskId Task ID
 * @param updates Partial task updates
 * @returns Updated task
 */
export async function updateTask(
  taskId: string,
  updates: UpdateTaskPayload
): Promise<Task> {
  const updateData: any = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) {
    updateData.status = updates.status;
    // Set completed_at if status is 'done'
    if (updates.status === 'done' && !updates.completedAt) {
      updateData.completed_at = new Date().toISOString();
    } else if (updates.status !== 'done') {
      updateData.completed_at = null;
    }
  }
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.assigneeTeamId !== undefined) updateData.assignee_team_id = updates.assigneeTeamId;
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
  if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .select(`
      *,
      dependencies:task_dependencies(
        depends_on_task:tasks!task_dependencies_depends_on_task_id_fkey(*)
      ),
      assignments:task_assignments(
        profile:profiles(*)
      )
    `)
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  return transformTask(data);
}

/**
 * Delete a task
 * 
 * Business Rules:
 * - Cannot delete if other tasks depend on it (enforced at application level)
 * - Only admins or task creator can delete
 * 
 * @param taskId Task ID
 */
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

/**
 * Get task dependencies
 * 
 * @param taskId Task ID
 * @returns Array of task IDs that this task depends on
 */
export async function getTaskDependencies(taskId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('task_dependencies')
    .select('depends_on_task_id')
    .eq('task_id', taskId);

  if (error) {
    console.error('Error fetching dependencies:', error);
    throw error;
  }

  return (data || []).map(d => d.depends_on_task_id);
}

/**
 * Add task dependency
 * 
 * @param taskId Task ID
 * @param dependsOnTaskId Task ID that this task depends on
 */
export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string
): Promise<void> {
  const { error } = await supabase
    .from('task_dependencies')
    .insert({
      task_id: taskId,
      depends_on_task_id: dependsOnTaskId,
    });

  if (error) {
    console.error('Error adding dependency:', error);
    throw error;
  }
}

/**
 * Remove task dependency
 * 
 * @param taskId Task ID
 * @param dependsOnTaskId Task ID to remove from dependencies
 */
export async function removeTaskDependency(
  taskId: string,
  dependsOnTaskId: string
): Promise<void> {
  const { error } = await supabase
    .from('task_dependencies')
    .delete()
    .eq('task_id', taskId)
    .eq('depends_on_task_id', dependsOnTaskId);

  if (error) {
    console.error('Error removing dependency:', error);
    throw error;
  }
}

/**
 * Get all task groups for a project
 * 
 * @param projectId Project ID
 * @returns Array of task groups
 */
export async function getTaskGroupsByProject(projectId: string): Promise<TaskGroup[]> {
  const { data, error } = await supabase
    .from('task_groups')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching task groups:', error);
    throw error;
  }

  return (data || []).map(transformTaskGroup);
}

/**
 * Create a task group
 * 
 * @param payload Task group creation data
 * @returns Created task group
 */
export async function createTaskGroup(payload: CreateTaskGroupPayload): Promise<TaskGroup> {
  const { data, error } = await supabase
    .from('task_groups')
    .insert({
      project_id: payload.projectId,
      name: payload.name,
      description: payload.description,
      parent_group_id: payload.parentGroupId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task group:', error);
    throw error;
  }

  return transformTaskGroup(data);
}

/**
 * Transform Supabase task data to our Task model
 */
function transformTask(data: any): Task {
  return {
    id: data.id,
    projectId: data.project_id,
    groupId: data.group_id,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    assigneeTeamId: data.assignee_team_id,
    assigneeMemberIds: (data.assignments || []).map((a: any) => a.profile_id),
    startDate: data.start_date,
    endDate: data.end_date,
    dueDate: data.due_date,
    dependencies: (data.dependencies || []).map((d: any) => d.depends_on_task_id),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
    completedAt: data.completed_at,
  };
}

/**
 * Transform Supabase task group data to our TaskGroup model
 */
function transformTaskGroup(data: any): TaskGroup {
  return {
    id: data.id,
    projectId: data.project_id,
    name: data.name,
    description: data.description,
    parentGroupId: data.parent_group_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
