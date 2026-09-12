import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { createGuestUser, generateGuestAvatar } from './authService';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
// Automatically strip trailing slashes or /rest/v1 if the user copied the Data API endpoint
const cleanUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    cleanUrl &&
    supabaseAnonKey &&
    cleanUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    !cleanUrl.includes('your-project-id')
  );
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(cleanUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
};

/**
 * Converts a Supabase User object into our application's UserProfile
 */
export const mapSupabaseUserToProfile = (sbUser: User): UserProfile => {
  const meta = sbUser.user_metadata || {};
  const provider = (sbUser.app_metadata?.provider || 'guest') as 'google' | 'guest';
  const fullName = meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Member';
  const cleanUsername = (meta.user_name || meta.preferred_username || sbUser.email?.split('@')[0] || `user_${sbUser.id.slice(0, 6)}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  const avatar = meta.avatar_url || meta.picture || generateGuestAvatar(cleanUsername);

  return {
    id: sbUser.id,
    name: fullName,
    username: cleanUsername.length >= 3 ? cleanUsername : `user_${sbUser.id.slice(0, 6)}`,
    email: sbUser.email || `${cleanUsername}@auth.community`,
    avatarUrl: avatar,
    role: 'MEMBER',
    authProvider: provider === 'google' ? 'google' : 'guest',
    isGuest: provider === 'guest' || sbUser.is_anonymous === true,
    storageUsedBytes: 0,
    storageQuotaBytes: 10 * 1024 * 1024 * 1024, // 10 GB for registered members
    createdAt: sbUser.created_at || new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
};

/**
 * Initiates Google OAuth registration / login
 */
export const signInWithGoogleOAuth = async (): Promise<{ success: boolean; error?: string; url?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase credentials are not yet configured in environment variables.',
    };
  }

  try {
    // Resolve the clean app URL: Prefer the development Cloud Run app URL or window.location.origin
    // Avoid returning into AI Studio's parent iframe directly
    let targetOrigin = window.location.origin;
    if (targetOrigin.includes('aistudio.google.com')) {
      targetOrigin = 'https://ais-dev-tkihrbg4cmofzpehaa5wc7-809043364040.asia-southeast1.run.app';
    }

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetOrigin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, url: data.url };
  } catch (err: any) {
    return { success: false, error: err.message || 'Google authentication failed' };
  }
};

/**
 * Initiates Guest Login - zero credential instant access
 */
export const signInAsGuestListener = async (customUsername?: string): Promise<{ success: boolean; user: UserProfile; error?: string }> => {
  const client = getSupabaseClient();

  // If Supabase has anonymous sign-in configured
  if (client) {
    try {
      const { data, error } = await client.auth.signInAnonymously();
      if (!error && data.user) {
        const profile = mapSupabaseUserToProfile(data.user);
        if (customUsername) {
          profile.username = customUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
        }
        return { success: true, user: profile };
      }
    } catch {
      // Fallback to local guest profile if anonymous auth is not enabled on the Supabase project
    }
  }

  // Instant local zero-credential guest profile
  const guestUser = createGuestUser(customUsername);
  return { success: true, user: guestUser };
};

/**
 * Signs out current user
 */
export const signOutUser = async (): Promise<void> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign out error:', err);
    }
  }
};
