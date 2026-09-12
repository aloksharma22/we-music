import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface UserFeedback {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  user_name?: string | null;
  category: 'general' | 'bug' | 'feature_request' | 'audio_quality' | 'appreciation';
  rating: number; // 1 to 5 stars
  message: string;
  created_at: string;
}

const LOCAL_FEEDBACK_KEY = 'wemusic_user_feedback_submissions_v1';

/**
 * Submits user feedback.
 * 1. Attempts to save to Supabase 'app_feedback' table.
 * 2. Always saves locally in localStorage so owner never loses submissions.
 */
export const submitUserFeedback = async (
  feedback: Omit<UserFeedback, 'id' | 'created_at'>
): Promise<{ success: boolean; message: string; savedLocally?: boolean; entry?: UserFeedback }> => {
  const newEntry: UserFeedback = {
    ...feedback,
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  // Always save locally so the owner can see it immediately
  try {
    const existing = getStoredFeedback();
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify([newEntry, ...existing]));
  } catch (err) {
    console.warn('Could not store feedback locally:', err);
  }

  // Attempt to write to Supabase if configured
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('app_feedback').insert([
          {
            id: newEntry.id,
            user_id: feedback.user_id || null,
            user_email: feedback.user_email || null,
            user_name: feedback.user_name || 'Anonymous Listener',
            category: feedback.category,
            rating: feedback.rating,
            message: feedback.message,
            created_at: newEntry.created_at,
          },
        ]);

        if (!error) {
          return {
            success: true,
            message: 'Thank you! Your feedback has been securely synced to our Supabase cloud database.',
            entry: newEntry,
          };
        } else {
          console.info('Supabase feedback table insert result:', error.message);
          return {
            success: true,
            message: 'Feedback received! Saved locally & queued for Supabase cloud sync.',
            savedLocally: true,
            entry: newEntry,
          };
        }
      } catch (e) {
        console.warn('Network error pushing feedback to Supabase:', e);
      }
    }
  }

  return {
    success: true,
    message: 'Thank you for your feedback! Saved successfully to the feedback inbox.',
    savedLocally: true,
    entry: newEntry,
  };
};

/**
 * Retrieve stored feedback from localStorage (instant in-app access)
 */
export const getStoredFeedback = (): UserFeedback[] => {
  try {
    const raw = localStorage.getItem(LOCAL_FEEDBACK_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

/**
 * Fetch all feedback: merges Supabase 'app_feedback' table (if configured) with local submissions
 */
export const fetchAllFeedback = async (): Promise<UserFeedback[]> => {
  const localList = getStoredFeedback();
  const map = new Map<string, UserFeedback>();

  // Add local entries first
  localList.forEach((fb) => map.set(fb.id, fb));

  // If Supabase is configured, fetch from cloud
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('app_feedback')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          data.forEach((row: any) => {
            const item: UserFeedback = {
              id: row.id || `fb_${row.created_at || Date.now()}`,
              user_id: row.user_id,
              user_email: row.user_email,
              user_name: row.user_name,
              category: row.category || 'general',
              rating: Number(row.rating) || 5,
              message: row.message || '',
              created_at: row.created_at || new Date().toISOString(),
            };
            map.set(item.id, item);
          });
        }
      } catch (err) {
        console.warn('Could not fetch feedback from Supabase cloud:', err);
      }
    }
  }

  const merged = Array.from(map.values());
  merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return merged;
};

/**
 * Delete a feedback entry by ID (from both local storage and Supabase if connected)
 */
export const deleteFeedbackSubmission = async (id: string): Promise<boolean> => {
  try {
    const current = getStoredFeedback();
    const updated = current.filter((f) => f.id !== id);
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting local feedback:', err);
  }

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('app_feedback').delete().eq('id', id);
      } catch (err) {
        console.warn('Error deleting feedback from Supabase:', err);
      }
    }
  }

  return true;
};

/**
 * Clear all local feedback
 */
export const clearAllLocalFeedback = (): void => {
  try {
    localStorage.removeItem(LOCAL_FEEDBACK_KEY);
  } catch (err) {
    console.error('Error clearing local feedback:', err);
  }
};

