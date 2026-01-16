/**
 * Core Domain Model: Ticket
 * 
 * Represents a ticket, inquiry, or backlog item.
 * Tickets can be submitted by clients or internal team members.
 * 
 * @module core/models/Ticket
 */

import { Priority } from './Task';

/**
 * Ticket type classification
 * - inquiry: General question or request for information
 * - issue: Bug report or problem that needs fixing
 * - feature_request: Request for new functionality
 * - backlog_item: Work item added to backlog for future consideration
 */
export enum TicketType {
  INQUIRY = 'inquiry',
  ISSUE = 'issue',
  FEATURE_REQUEST = 'feature-request',
  BACKLOG_ITEM = 'backlog-item'
}

/**
 * Ticket status workflow
 * Status progression is configurable per workspace
 */
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  PENDING = 'pending', // Waiting on client/team response
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

/**
 * Ticket entity
 * 
 * Represents a single ticket, inquiry, or backlog item.
 * Tickets can be linked to projects, tasks, or milestones.
 */
export interface Ticket {
  id: string;
  
  // Classification
  type: TicketType;
  status: TicketStatus;
  priority: Priority;
  
  // Content
  title: string;
  description: string;
  
  // Relationships
  projectId?: string; // Optional - ticket may be project-agnostic
  linkedTaskIds?: string[]; // Tasks related to this ticket
  linkedMilestoneIds?: string[]; // Milestones related to this ticket
  
  // Reporter information
  reporterName: string;
  reporterEmail?: string;
  reporterId?: string; // User ID if reporter is a system user
  
  // Assignment
  assignedTeamId?: string;
  assignedMemberIds?: string[];
  
  // Resolution
  resolution?: string; // How the ticket was resolved
  resolvedAt?: string; // ISO timestamp
  resolvedBy?: string; // User ID
  
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Ticket creation payload
 * Used when creating a new ticket (typically from client portal)
 */
export interface CreateTicketPayload {
  type: TicketType;
  title: string;
  description: string;
  priority: Priority;
  projectId?: string;
  reporterName: string;
  reporterEmail?: string;
  reporterId?: string;
  linkedTaskIds?: string[];
  linkedMilestoneIds?: string[];
}

/**
 * Ticket update payload
 */
export type UpdateTicketPayload = Partial<Omit<Ticket, 'id' | 'createdAt' | 'reporterName' | 'reporterEmail'>>;
