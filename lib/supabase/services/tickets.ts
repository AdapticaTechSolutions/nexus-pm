/**
 * Tickets Service
 * 
 * CRUD operations for tickets using Supabase.
 * Handles ticket creation, updates, and resolution.
 * 
 * @module lib/supabase/services/tickets
 */

import { supabase } from '../client';
import type { Ticket, CreateTicketPayload, UpdateTicketPayload } from '../../../core/models/Ticket';
import { TicketStatus, TicketType } from '../../../core/models/Ticket';

/**
 * Get all tickets
 * 
 * Returns tickets based on user's access:
 * - Admins: All tickets
 * - Team members: Tickets for assigned projects
 * - Clients: Tickets for their projects or tickets they created
 * 
 * @param filters Optional filters (projectId, status, type, etc.)
 * @returns Array of tickets
 */
export async function getTickets(filters?: {
  projectId?: string;
  status?: TicketStatus;
  type?: TicketType;
}): Promise<Ticket[]> {
  let query = supabase
    .from('tickets')
    .select(`
      *,
      linked_tasks:ticket_tasks(
        task:tasks(*)
      ),
      linked_milestones:ticket_milestones(
        milestone:milestones(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (filters?.projectId) {
    query = query.eq('project_id', filters.projectId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }

  return (data || []).map(transformTicket);
}

/**
 * Get a single ticket by ID
 * 
 * @param ticketId Ticket ID
 * @returns Ticket or null if not found
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      linked_tasks:ticket_tasks(
        task:tasks(*)
      ),
      linked_milestones:ticket_milestones(
        milestone:milestones(*)
      )
    `)
    .eq('id', ticketId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching ticket:', error);
    throw error;
  }

  return data ? transformTicket(data) : null;
}

/**
 * Create a new ticket
 * 
 * Business Rules:
 * - Any authenticated user can create tickets
 * - Clients can submit inquiries/issues/feature requests
 * - Reporter information is captured
 * 
 * @param payload Ticket creation data
 * @returns Created ticket
 */
export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  // Get current user's profile if reporter_id is not provided
  let reporterId = payload.reporterId;
  if (!reporterId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .single();
    reporterId = profile?.id;
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      project_id: payload.projectId,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      reporter_name: payload.reporterName,
      reporter_email: payload.reporterEmail,
      reporter_id: reporterId,
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }

  // Link tasks if provided
  if (payload.linkedTaskIds && payload.linkedTaskIds.length > 0) {
    await supabase.from('ticket_tasks').insert(
      payload.linkedTaskIds.map(taskId => ({
        ticket_id: data.id,
        task_id: taskId,
      }))
    );
  }

  // Link milestones if provided
  if (payload.linkedMilestoneIds && payload.linkedMilestoneIds.length > 0) {
    await supabase.from('ticket_milestones').insert(
      payload.linkedMilestoneIds.map(milestoneId => ({
        ticket_id: data.id,
        milestone_id: milestoneId,
      }))
    );
  }

  return getTicketById(data.id) as Promise<Ticket>;
}

/**
 * Update an existing ticket
 * 
 * Business Rules:
 * - Team members can update tickets for assigned projects
 * - Users can update tickets they created
 * - Status transitions follow workflow (enforced at application level)
 * 
 * @param ticketId Ticket ID
 * @param updates Partial ticket updates
 * @returns Updated ticket
 */
export async function updateTicket(
  ticketId: string,
  updates: UpdateTicketPayload
): Promise<Ticket> {
  const updateData: any = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) {
    updateData.status = updates.status;
    // Set resolved_at if status is 'resolved'
    if (updates.status === 'resolved' && !updates.resolvedAt) {
      updateData.resolved_at = new Date().toISOString();
    }
  }
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.assignedTeamId !== undefined) updateData.assigned_team_id = updates.assignedTeamId;
  if (updates.resolution !== undefined) updateData.resolution = updates.resolution;
  if (updates.resolvedAt !== undefined) updateData.resolved_at = updates.resolvedAt;
  if (updates.resolvedBy !== undefined) updateData.resolved_by = updates.resolvedBy;

  const { data, error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId)
    .select(`
      *,
      linked_tasks:ticket_tasks(
        task:tasks(*)
      ),
      linked_milestones:ticket_milestones(
        milestone:milestones(*)
      )
    `)
    .single();

  if (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }

  return transformTicket(data);
}

/**
 * Resolve a ticket
 * 
 * Sets ticket status to 'resolved' and records resolution details.
 * 
 * @param ticketId Ticket ID
 * @param resolution Resolution description
 * @returns Resolved ticket
 */
export async function resolveTicket(
  ticketId: string,
  resolution: string
): Promise<Ticket> {
  // Get current user's profile for resolved_by
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .single();

  return updateTicket(ticketId, {
    status: TicketStatus.RESOLVED,
    resolution,
    resolvedBy: profile?.id,
    resolvedAt: new Date().toISOString(),
  });
}

/**
 * Delete a ticket
 * 
 * Business Rules:
 * - Only admins can delete tickets
 * 
 * @param ticketId Ticket ID
 */
export async function deleteTicket(ticketId: string): Promise<void> {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId);

  if (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
}

/**
 * Transform Supabase ticket data to our Ticket model
 */
function transformTicket(data: any): Ticket {
  return {
    id: data.id,
    type: data.type,
    status: data.status,
    priority: data.priority,
    title: data.title,
    description: data.description,
    projectId: data.project_id,
    linkedTaskIds: (data.linked_tasks || []).map((lt: any) => lt.task_id),
    linkedMilestoneIds: (data.linked_milestones || []).map((lm: any) => lm.milestone_id),
    reporterName: data.reporter_name,
    reporterEmail: data.reporter_email,
    reporterId: data.reporter_id,
    assignedTeamId: data.assigned_team_id,
    resolution: data.resolution,
    resolvedAt: data.resolved_at,
    resolvedBy: data.resolved_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
