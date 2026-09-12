import { TrackComment, CommentReply, UserProfile } from '../types';
import {
  fetchCommentsFromSupabase,
  insertCommentToSupabase,
  updateCommentInSupabase,
} from './supabaseDataService';
import { isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY_COMMENTS = 'wemusic_track_comments';

// Dummy seeds completely removed. Only genuine user-posted comments are shown.
function loadStoredComments(): Record<string, TrackComment[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Cleanse any old dummy/seed comments from previous sessions
      const cleaned: Record<string, TrackComment[]> = {};
      for (const [trackId, list] of Object.entries(parsed)) {
        if (Array.isArray(list)) {
          const genuineOnly = list.filter(
            (c: any) =>
              c &&
              !c.id?.startsWith('seed_') &&
              !c.id?.startsWith('cmt_seed_') &&
              c.username !== 'mayabeats' &&
              c.username !== 'rohan_audio' &&
              c.username !== 'liamvibe'
          );
          if (genuineOnly.length > 0) {
            cleaned[trackId] = genuineOnly;
          }
        }
      }
      return cleaned;
    }
  } catch (e) {
    console.error('Failed to load comments from storage:', e);
  }
  return {};
}

function saveStoredComments(data: Record<string, TrackComment[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save comments to storage:', e);
  }
}

class CommentService {
  private comments: Record<string, TrackComment[]> = loadStoredComments();

  /**
   * Returns genuine comments for a track. Default is empty array [] if no genuine comments exist.
   */
  public getComments(trackId: string): TrackComment[] {
    return this.comments[trackId] || [];
  }

  /**
   * Asynchronously loads genuine comments from Supabase cloud if configured,
   * merging them with local comments.
   */
  public async syncCommentsFromCloud(trackId: string): Promise<TrackComment[]> {
    if (!isSupabaseConfigured()) {
      return this.getComments(trackId);
    }

    try {
      const cloudComments = await fetchCommentsFromSupabase(trackId);
      if (cloudComments && cloudComments.length > 0) {
        const local = this.getComments(trackId);
        const map = new Map<string, TrackComment>();
        cloudComments.forEach((c) => map.set(c.id, c));
        local.forEach((c) => map.set(c.id, c));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.comments[trackId] = merged;
        saveStoredComments(this.comments);
        return merged;
      }
    } catch (err) {
      console.warn('Could not sync cloud comments:', err);
    }
    return this.getComments(trackId);
  }

  /**
   * Returns exact genuine comment count (top-level comments + genuine replies)
   */
  public getCommentCount(trackId: string): number {
    const list = this.getComments(trackId);
    let total = list.length;
    for (const c of list) {
      total += c.replies?.length || 0;
    }
    return total;
  }

  public addComment(
    trackId: string,
    user: UserProfile,
    text: string,
    trackTimestampSec?: number
  ): TrackComment {
    if (!text.trim()) {
      throw new Error('Comment cannot be empty.');
    }

    const newComment: TrackComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      trackId,
      userId: user.id,
      userName: user.name,
      username: user.username,
      userAvatar: user.avatarUrl,
      userRole: user.role,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      trackTimestampSec:
        trackTimestampSec && trackTimestampSec > 0 ? Math.floor(trackTimestampSec) : undefined,
      likesCount: 0,
      likedBy: [],
      replies: [],
    };

    const currentList = this.getComments(trackId);
    this.comments[trackId] = [newComment, ...currentList];
    saveStoredComments(this.comments);

    // Asynchronously persist to Supabase if configured
    if (isSupabaseConfigured() && !user.isGuest) {
      insertCommentToSupabase(newComment).catch((e) =>
        console.warn('Supabase comment sync error:', e)
      );
    }

    return newComment;
  }

  public addReply(
    trackId: string,
    commentId: string,
    user: UserProfile,
    text: string
  ): CommentReply {
    if (!text.trim()) {
      throw new Error('Reply cannot be empty.');
    }

    const currentList = this.getComments(trackId);
    const targetComment = currentList.find((c) => c.id === commentId);
    if (!targetComment) {
      throw new Error('Target comment not found.');
    }

    const newReply: CommentReply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      commentId,
      userId: user.id,
      userName: user.name,
      username: user.username,
      userAvatar: user.avatarUrl,
      userRole: user.role,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      likesCount: 0,
      likedBy: [],
    };

    targetComment.replies = [...(targetComment.replies || []), newReply];
    this.comments[trackId] = currentList;
    saveStoredComments(this.comments);

    if (isSupabaseConfigured()) {
      updateCommentInSupabase(targetComment).catch((e) =>
        console.warn('Supabase comment reply update error:', e)
      );
    }

    return newReply;
  }

  public toggleLikeComment(trackId: string, commentId: string, userId: string): boolean {
    const currentList = this.getComments(trackId);
    const targetComment = currentList.find((c) => c.id === commentId);
    if (!targetComment) return false;

    const liked = targetComment.likedBy.includes(userId);
    if (liked) {
      targetComment.likedBy = targetComment.likedBy.filter((id) => id !== userId);
      targetComment.likesCount = Math.max(0, targetComment.likesCount - 1);
    } else {
      targetComment.likedBy.push(userId);
      targetComment.likesCount += 1;
    }

    this.comments[trackId] = currentList;
    saveStoredComments(this.comments);

    if (isSupabaseConfigured()) {
      updateCommentInSupabase(targetComment).catch((e) =>
        console.warn('Supabase comment like update error:', e)
      );
    }

    return !liked;
  }

  public deleteComment(trackId: string, commentId: string, userId: string): boolean {
    const currentList = this.getComments(trackId);
    const comment = currentList.find((c) => c.id === commentId);
    if (!comment) return false;

    // Allow deleting own comments or admin
    if (comment.userId !== userId) {
      return false;
    }

    this.comments[trackId] = currentList.filter((c) => c.id !== commentId);
    saveStoredComments(this.comments);
    return true;
  }

  /**
   * Purges all comments across all tracks (for reset/clean slate)
   */
  public clearAllComments(): void {
    this.comments = {};
    saveStoredComments(this.comments);
  }
}

export const commentService = new CommentService();
