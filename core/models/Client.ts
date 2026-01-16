/**
 * Core Domain Model: Client
 * 
 * Represents a client entity.
 * Clients have access to the client portal to view their projects.
 * 
 * @module core/models/Client
 */

/**
 * Client entity
 * 
 * Represents a client organization or individual.
 * Clients can have multiple projects.
 */
export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  
  // Portal access
  portalAccessEnabled: boolean;
  portalAccessToken?: string; // For authentication
  
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Client creation payload
 */
export interface CreateClientPayload {
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  portalAccessEnabled?: boolean;
}

/**
 * Client update payload
 */
export type UpdateClientPayload = Partial<Omit<Client, 'id' | 'createdAt'>>;
