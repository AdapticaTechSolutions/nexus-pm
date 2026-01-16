/**
 * Ticket Repository
 * 
 * Data access layer for tickets.
 * Handles CRUD operations and data persistence.
 * 
 * @module data/repositories/TicketRepository
 */

import { Ticket } from '../../core/models/Ticket';
import { TicketService } from '../../core/services/TicketService';

/**
 * Ticket repository interface
 */
export interface ITicketRepository {
  /**
   * Get all tickets
   */
  getAll(): Ticket[];
  
  /**
   * Get ticket by ID
   */
  getById(id: string): Ticket | undefined;
  
  /**
   * Get tickets by project ID
   */
  getByProjectId(projectId: string): Ticket[];
  
  /**
   * Get tickets by status
   */
  getByStatus(status: string): Ticket[];
  
  /**
   * Get tickets by type
   */
  getByType(type: string): Ticket[];
  
  /**
   * Create a new ticket
   */
  create(ticket: Ticket): Ticket;
  
  /**
   * Update an existing ticket
   */
  update(id: string, updates: Partial<Ticket>): Ticket;
  
  /**
   * Delete a ticket
   */
  delete(id: string): void;
  
  /**
   * Check if ticket exists
   */
  exists(id: string): boolean;
}

/**
 * In-memory ticket repository implementation
 */
export class TicketRepository implements ITicketRepository {
  private tickets: Map<string, Ticket> = new Map();
  private ticketService: TicketService;
  
  constructor(ticketService: TicketService) {
    this.ticketService = ticketService;
  }
  
  initialize(tickets: Ticket[]): void {
    this.tickets.clear();
    tickets.forEach(ticket => {
      this.tickets.set(ticket.id, ticket);
    });
  }
  
  getAll(): Ticket[] {
    return Array.from(this.tickets.values());
  }
  
  getById(id: string): Ticket | undefined {
    return this.tickets.get(id);
  }
  
  getByProjectId(projectId: string): Ticket[] {
    return Array.from(this.tickets.values()).filter(t => t.projectId === projectId);
  }
  
  getByStatus(status: string): Ticket[] {
    return Array.from(this.tickets.values()).filter(t => t.status === status);
  }
  
  getByType(type: string): Ticket[] {
    return Array.from(this.tickets.values()).filter(t => t.type === type);
  }
  
  create(ticket: Ticket): Ticket {
    if (this.tickets.has(ticket.id)) {
      throw new Error(`Ticket with ID ${ticket.id} already exists`);
    }
    
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }
  
  update(id: string, updates: Partial<Ticket>): Ticket {
    const existing = this.tickets.get(id);
    if (!existing) {
      throw new Error(`Ticket ${id} not found`);
    }
    
    const updated = this.ticketService.updateTicket(id, updates);
    this.tickets.set(id, updated);
    return updated;
  }
  
  delete(id: string): void {
    if (!this.tickets.has(id)) {
      throw new Error(`Ticket ${id} not found`);
    }
    
    this.tickets.delete(id);
  }
  
  exists(id: string): boolean {
    return this.tickets.has(id);
  }
}
