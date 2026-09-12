import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { Playlist, TrackComment, CommentReply, UserProfile } from '../types';

/**
 * Service to sync playlists, favorites, and comments with Supabase PostgreSQL
 */

// ==========================================
// 1. PROFILES SYNC
// ==========================================
export async function syncUserProfileToSupabase(profile: UserProfile): Promise<void> {
  if (!isSupabaseConfigured() || profile.isGuest) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('profiles').upsert(
      {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        email: profile.email,
        avatar_url: profile.avatarUrl,
        role: profile.role,
        auth_provider: profile.authProvider,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Failed to sync profile to Supabase:', err);
  }
}

// ==========================================
// 2. PLAYLISTS SYNC
// ==========================================
export async function fetchUserPlaylistsFromSupabase(userId: string): Promise<Playlist[]> {
  if (!isSupabaseConfigured()) return [];
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('playlists')
      .select('*')
      .or(`owner_id.eq.${userId},is_private.eq.false`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch playlists from Supabase:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      coverArtUrl: row.cover_art_url || '',
      ownerId: row.owner_id,
      ownerName: row.owner_name,
      ownerUsername: row.owner_username,
      isPrivate: row.is_private,
      isCollaborative: row.is_collaborative,
      trackCount: row.track_count || 0,
      totalDuration: row.total_duration || 0,
      trackIds: Array.isArray(row.track_ids) ? row.track_ids : [],
      collaborators: Array.isArray(row.collaborators) ? row.collaborators : [],
      isPinned: row.is_pinned,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn('Error fetching playlists:', err);
    return [];
  }
}

export async function upsertPlaylistToSupabase(playlist: Playlist): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('playlists').upsert(
      {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        cover_art_url: playlist.coverArtUrl,
        owner_id: playlist.ownerId,
        owner_name: playlist.ownerName,
        owner_username: playlist.ownerUsername,
        is_private: playlist.isPrivate,
        is_collaborative: playlist.isCollaborative,
        track_count: playlist.trackCount,
        total_duration: playlist.totalDuration,
        track_ids: playlist.trackIds,
        collaborators: playlist.collaborators,
        is_pinned: playlist.isPinned,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Failed to upsert playlist to Supabase:', err);
  }
}

export async function deletePlaylistFromSupabase(playlistId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('playlists').delete().eq('id', playlistId);
  } catch (err) {
    console.warn('Failed to delete playlist from Supabase:', err);
  }
}

// ==========================================
// 3. FAVORITES SYNC
// ==========================================
export async function fetchUserFavoritesFromSupabase(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('user_favorites')
      .select('track_id')
      .eq('user_id', userId);

    if (error) {
      console.warn('Could not fetch user favorites:', error.message);
      return [];
    }

    return (data || []).map((row: any) => row.track_id);
  } catch (err) {
    console.warn('Error fetching favorites:', err);
    return [];
  }
}

export async function toggleFavoriteInSupabase(userId: string, trackId: string, isFav: boolean): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    if (isFav) {
      await client.from('user_favorites').upsert(
        { user_id: userId, track_id: trackId },
        { onConflict: 'user_id,track_id' }
      );
    } else {
      await client.from('user_favorites').delete().match({ user_id: userId, track_id: trackId });
    }
  } catch (err) {
    console.warn('Failed to toggle favorite in Supabase:', err);
  }
}

// ==========================================
// 4. COMMENTS SYNC
// ==========================================
export async function fetchCommentsFromSupabase(trackId: string): Promise<TrackComment[]> {
  if (!isSupabaseConfigured()) return [];
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('track_comments')
      .select('*')
      .eq('track_id', trackId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch comments from Supabase:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      trackId: row.track_id,
      userId: row.user_id,
      userName: row.user_name,
      username: row.username,
      userAvatar: row.user_avatar,
      userRole: row.user_role,
      text: row.text,
      trackTimestampSec: row.track_timestamp_sec,
      likesCount: row.likes_count || 0,
      likedBy: Array.isArray(row.liked_by) ? row.liked_by : [],
      isPinned: row.is_pinned,
      replies: Array.isArray(row.replies) ? row.replies : [],
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('Error fetching comments:', err);
    return [];
  }
}

export async function insertCommentToSupabase(comment: TrackComment): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('track_comments').insert({
      id: comment.id,
      track_id: comment.trackId,
      user_id: comment.userId,
      user_name: comment.userName,
      username: comment.username,
      user_avatar: comment.userAvatar,
      user_role: comment.userRole || 'MEMBER',
      text: comment.text,
      track_timestamp_sec: comment.trackTimestampSec,
      likes_count: comment.likesCount,
      liked_by: comment.likedBy,
      is_pinned: comment.isPinned || false,
      replies: comment.replies || [],
      created_at: comment.createdAt,
    });
  } catch (err) {
    console.warn('Failed to insert comment to Supabase:', err);
  }
}

export async function updateCommentInSupabase(comment: TrackComment): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client
      .from('track_comments')
      .update({
        likes_count: comment.likesCount,
        liked_by: comment.likedBy,
        replies: comment.replies,
        is_pinned: comment.isPinned,
      })
      .eq('id', comment.id);
  } catch (err) {
    console.warn('Failed to update comment in Supabase:', err);
  }
}
