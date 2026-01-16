/**
 * Supabase Client Configuration
 * 
 * Centralized Supabase client initialization.
 * This is the single source of truth for Supabase connection.
 * 
 * Usage:
 *   import { supabase } from './lib/supabase/client';
 *   const { data, error } = await supabase.from('projects').select('*');
 * 
 * @module lib/supabase/client
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase project configuration
 * 
 * These values should be set via environment variables in production.
 * For development, they're provided directly.
 * 
 * Security Note:
 * - The anon/public key is safe to expose in client-side code
 * - Row Level Security (RLS) policies enforce data access control
 * - Never expose the service_role key in client-side code
 */
const supabaseUrl = 'https://oqxdloxmajfkmuaxnzzp.supabase.co';
const supabaseAnonKey = 'sb_publishable_EZxE79MJIOeVhSHr1WNg_g_ONj1Rjv8';

/**
 * Supabase client instance
 * 
 * This client is used for all database operations.
 * It automatically handles:
 * - Authentication (via auth methods)
 * - Row Level Security enforcement
 * - Real-time subscriptions (if needed)
 * - Automatic retries and error handling
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Automatically refresh session before it expires
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session from URL (for OAuth callbacks)
    detectSessionInUrl: true,
  },
});

/**
 * Get the current authenticated user
 * 
 * @returns Current user or null if not authenticated
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
}

/**
 * Get the current user's profile
 * 
 * @returns User profile with role information
 */
export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error getting profile:', error);
    return null;
  }

  return data;
}

/**
 * Check if current user is an admin
 * 
 * @returns True if user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === 'admin';
}

/**
 * Check if current user is a client
 * 
 * @returns True if user is a client
 */
export async function isCurrentUserClient(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === 'client';
}
