/**
 * Authentication Service
 * 
 * Handles user authentication operations using Supabase Auth.
 * Provides functions for signup, login, logout, and session management.
 * 
 * @module lib/supabase/auth
 */

import { supabase } from './client';
import type { User, Session, AuthError } from '@supabase/supabase-js';

/**
 * Sign up a new user
 * 
 * Creates a new user account and automatically creates a profile via trigger.
 * 
 * @param email User email address
 * @param password User password (must meet Supabase password requirements)
 * @param fullName Optional full name for the user
 * @param role Optional role (defaults to 'team_member', only admins can set 'admin')
 * @returns User session if successful, null otherwise
 */
export async function signUp(
  email: string,
  password: string,
  fullName?: string,
  role: 'admin' | 'team_member' | 'client' = 'team_member'
): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role, // This will be used by the trigger to set the profile role
      },
    },
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign in an existing user
 * 
 * Authenticates a user with email and password.
 * 
 * @param email User email address
 * @param password User password
 * @returns User session if successful, null otherwise
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign out the current user
 * 
 * Ends the current session and clears authentication state.
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session
 * 
 * @returns Current session or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
}

/**
 * Listen to authentication state changes
 * 
 * Useful for updating UI when user signs in/out.
 * 
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * Reset password for a user
 * 
 * Sends a password reset email to the user.
 * 
 * @param email User email address
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error };
}

/**
 * Update user password
 * 
 * Updates the password for the current authenticated user.
 * 
 * @param newPassword New password
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
}
