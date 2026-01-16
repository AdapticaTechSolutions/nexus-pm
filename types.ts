/**
 * Types Index - Backward Compatibility Layer
 * 
 * This file maintains backward compatibility with existing components
 * while re-exporting from the new clean architecture models.
 * 
 * @module types
 */

// Re-export from core models for backward compatibility
export { TaskStatus, Priority } from './core/models/Task';
export { TicketType } from './core/models/Ticket';
export type { CurrencyCode } from './core/models/Project';

// Re-export model interfaces
export type { Project, Deliverable, BudgetExpense, ResourceAllocation } from './core/models/Project';
export type { Task, TaskGroup, Milestone } from './core/models/Task';
export type { Team, TeamMember } from './core/models/Team';
export type { Ticket } from './core/models/Ticket';
export type { Client } from './core/models/Client';

// Legacy type exports for backward compatibility
export type ProjectHealth = 'green' | 'yellow' | 'red';
export type ViewRole = 'admin' | 'client';
