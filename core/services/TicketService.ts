/**
 * Ticket Service
 * 
 * Business logic layer for ticket operations.
 * Handles ticket lifecycle, workflow transitions, and client submissions.
 * 
 * @module core/services/TicketService
 */

import { Ticket, CreateTicketPayload, UpdateTicketPayload, TicketStatus, TicketType } from '../models/Ticket';
import { getAppConfig } from '../../config/AppConfig';

/**
 * Ticket service interface
 */
export interface ITicketService {
  /**
   * Create a new ticket
   * Typically used for client submissions
   */
  createTicket(payload: CreateTicketPayload): Ticket;
  
  /**
   * Update an existing ticket
   */
  updateTicket(ticketId: string, updates: UpdateTicketPayload): Ticket;
  
  /**
   * Update ticket status
   * Validates workflow transitions
   */
  updateTicketStatus(ticket: Ticket, newStatus: TicketStatus): Ticket;
  
  /**
   * Resolve a ticket
   * Sets status to resolved and records resolution details
   */
  resolveTicket(ticketId: string, resolution: string, resolvedBy: string): Ticket;
  
  /**
   * Check if ticket can transition to new status
   */
  canTransitionStatus(currentStatus: TicketStatus, newStatus: TicketStatus): boolean;
  
  /**
   * Validate ticket can be created
   * Checks feature flags and business rules
   */
  canCreateTicket(type: TicketType): boolean;
}

/**
 * Ticket Service Implementation
 */
export class TicketService implements ITicketService {
  /**
   * Create a new ticket
   * 
   * Business rules:
   * - Validates client ticketing is enabled
   * - Sets default status
   * - Records creation timestamp
   * 
   * @param payload Ticket creation data
   * @returns Created ticket entity
   */
  createTicket(payload: CreateTicketPayload): Ticket {
    const config = getAppConfig();
    
    // Check if client ticketing is enabled
    if (!config.features.clientTicketingEnabled) {
      throw new Error('Client ticketing is disabled');
    }
    
    // Validate ticket type
    if (!this.canCreateTicket(payload.type)) {
      throw new Error(`Ticket type ${payload.type} is not allowed`);
    }
    
    const now = new Date().toISOString();
    
    return {
      id: this.generateId(),
      type: payload.type,
      status: config.ticketWorkflow.defaultStatus as TicketStatus,
      priority: payload.priority,
      title: payload.title,
      description: payload.description,
      projectId: payload.projectId,
      linkedTaskIds: payload.linkedTaskIds,
      linkedMilestoneIds: payload.linkedMilestoneIds,
      reporterName: payload.reporterName,
      reporterEmail: payload.reporterEmail,
      reporterId: payload.reporterId,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  /**
   * Update an existing ticket
   * 
   * Business rules:
   * - Validates status transitions
   * - Updates timestamp
   * 
   * @param ticketId ID of ticket to update
   * @param updates Partial ticket updates
   * @returns Updated ticket
   */
  updateTicket(ticketId: string, updates: UpdateTicketPayload): Ticket {
    // This would fetch from repository
    const ticket = updates as Ticket;
    
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }
    
    // Validate status transition if status is being updated
    if (updates.status && updates.status !== ticket.status) {
      if (!this.canTransitionStatus(ticket.status, updates.status)) {
        throw new Error(`Cannot transition from ${ticket.status} to ${updates.status}`);
      }
    }
    
    return {
      ...ticket,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Update ticket status
   * 
   * Validates workflow transitions and updates ticket.
   * 
   * @param ticket Ticket to update
   * @param newStatus New status to transition to
   * @returns Updated ticket
   */
  updateTicketStatus(ticket: Ticket, newStatus: TicketStatus): Ticket {
    if (!this.canTransitionStatus(ticket.status, newStatus)) {
      throw new Error(`Cannot transition from ${ticket.status} to ${newStatus}`);
    }
    
    return this.updateTicket(ticket.id, { status: newStatus });
  }
  
  /**
   * Resolve a ticket
   * 
   * Sets status to resolved and records resolution details.
   * 
   * @param ticketId ID of ticket to resolve
   * @param resolution Resolution description
   * @param resolvedBy User ID who resolved the ticket
   * @returns Resolved ticket
   */
  resolveTicket(ticketId: string, resolution: string, resolvedBy: string): Ticket {
    const now = new Date().toISOString();
    
    return this.updateTicket(ticketId, {
      status: TicketStatus.RESOLVED,
      resolution,
      resolvedBy,
      resolvedAt: now,
    });
  }
  
  /**
   * Check if ticket can transition to new status
   * 
   * Uses workflow configuration to determine valid transitions.
   * 
   * @param currentStatus Current ticket status
   * @param newStatus Desired new status
   * @returns True if transition is allowed
   */
  canTransitionStatus(currentStatus: TicketStatus, newStatus: TicketStatus): boolean {
    if (currentStatus === newStatus) {
      return true; // No-op transition
    }
    
    const config = getAppConfig();
    const allowedTransitions = config.ticketWorkflow.transitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }
  
  /**
   * Validate ticket can be created
   * 
   * Checks feature flags and business rules.
   * 
   * @param type Ticket type
   * @returns True if ticket can be created
   */
  canCreateTicket(type: TicketType): boolean {
    const config = getAppConfig();
    
    // All ticket types require client ticketing to be enabled
    if (!config.features.clientTicketingEnabled) {
      return false;
    }
    
    // Additional type-specific validations could go here
    return true;
  }
  
  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const ticketService = new TicketService();
