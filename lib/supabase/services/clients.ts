/**
 * Clients Service
 * 
 * CRUD operations for clients using Supabase.
 * All operations respect Row Level Security policies.
 * 
 * @module lib/supabase/services/clients
 */

import { supabase } from '../client';
import type { Client, CreateClientPayload, UpdateClientPayload } from '../../../core/models/Client';

/**
 * Get all clients
 * 
 * @returns Array of clients
 */
export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }

  return (data || []).map(transformClient);
}

/**
 * Get a single client by ID
 * 
 * @param clientId Client ID
 * @returns Client or null if not found
 */
export async function getClientById(clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching client:', error);
    throw error;
  }

  return data ? transformClient(data) : null;
}

/**
 * Create a new client
 * 
 * @param payload Client creation data
 * @returns Created client
 */
export async function createClient(payload: CreateClientPayload): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: payload.name,
      company: payload.company,
      email: payload.email,
      phone: payload.phone || null,
      address: payload.address || null,
      portal_access_enabled: payload.portalAccessEnabled ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }

  return transformClient(data);
}

/**
 * Update an existing client
 * 
 * @param clientId Client ID
 * @param updates Partial client updates
 * @returns Updated client
 */
export async function updateClient(
  clientId: string,
  updates: UpdateClientPayload
): Promise<Client> {
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.company !== undefined) updateData.company = updates.company;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.address !== undefined) updateData.address = updates.address;
  if (updates.portalAccessEnabled !== undefined) updateData.portal_access_enabled = updates.portalAccessEnabled;

  const { data, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }

  return transformClient(data);
}

/**
 * Delete a client
 * 
 * @param clientId Client ID
 */
export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
}

/**
 * Transform Supabase client data to our Client model
 */
function transformClient(data: any): Client {
  return {
    id: data.id,
    name: data.name,
    company: data.company,
    email: data.email,
    phone: data.phone,
    address: data.address,
    portalAccessEnabled: data.portal_access_enabled,
    portalAccessToken: data.portal_access_token,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
