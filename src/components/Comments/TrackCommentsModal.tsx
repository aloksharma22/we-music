import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MessageSquare,
  Heart,
  CornerDownRight,
  Trash2,
  Send,
  Lock,
  Clock,
  Pin,
  Sparkles,
} from 'lucide-react';
import { Track, UserProfile, TrackComment } from '../../types';
import { commentService } from '../../services/commentService';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

interface TrackCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  currentUser: UserProfile;
  currentPlaybackTime?: number;
  onOpenAuthModal: () => void;
  onSeekToTimestamp?: (seconds: number) => void;
  onCommentCountChange?: (trackId: string, newCount: number) => void;
}

export const TrackCommentsModal: React.FC<TrackCommentsModalProps> = ({
  isOpen,
  onClose,
  track,
  currentUser,
  currentPlaybackTime = 0,
  onOpenAuthModal,
  onSeekToTimestamp,
  onCommentCountChange,
}) => {
  const [comments, setComments] = useState<TrackComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load comments when track changes or modal opens
  useEffect(() => {
    if (track && isOpen) {
      const list = commentService.getComments(track.id);
      setComments(list);
      setErrorMessage(null);
      setNewCommentText('');
      setReplyingToId(null);
    }
  }, [track, isOpen]);

  const totalCount = useMemo(() => {
    let count = comments.length;
    for (const c of comments) {
      count += c.replies?.length || 0;
    }
    return count;
  }, [comments]);

  if (!isOpen || !track) return null;

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.isGuest) {
      setErrorMessage('Guest mode users cannot post comments. Please sign in or create an account.');
      return;
    }

    if (!newCommentText.trim()) return;

    try {
      const timestampSec = includeTimestamp && currentPlaybackTime > 0 ? Math.floor(currentPlaybackTime) : undefined;
      const created = commentService.addComment(track.id, currentUser, newCommentText, timestampSec);
      const updated = [created, ...comments];
      setComments(updated);
      setNewCommentText('');
      setIncludeTimestamp(false);
      setErrorMessage(null);
      if (onCommentCountChange) {
        onCommentCountChange(track.id, commentService.getCommentCount(track.id));
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to post comment');
    }
  };

  const handlePostReply = (commentId: string) => {
    if (currentUser.isGuest) {
      setErrorMessage('Guest mode users cannot post comments. Please sign in.');
      return;
    }

    if (!replyText.trim()) return;

    try {
      commentService.addReply(track.id, commentId, currentUser, replyText);
      const refreshed = commentService.getComments(track.id);
      setComments(refreshed);
      setReplyText('');
      setReplyingToId(null);
      setErrorMessage(null);
      if (onCommentCountChange) {
        onCommentCountChange(track.id, commentService.getCommentCount(track.id));
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to post reply');
    }
  };

  const handleToggleLike = (commentId: string) => {
    commentService.toggleLikeComment(track.id, commentId, currentUser.id);
    const refreshed = commentService.getComments(track.id);
    setComments(refreshed);
  };

  const handleDeleteComment = (commentId: string) => {
    const success = commentService.deleteComment(track.id, commentId, currentUser.id);
    if (success) {
      const refreshed = commentService.getComments(track.id);
      setComments(refreshed);
      if (onCommentCountChange) {
        onCommentCountChange(track.id, commentService.getCommentCount(track.id));
      }
    }
  };

  const handleQuickEmoji = (emoji: string) => {
    if (currentUser.isGuest) {
      onOpenAuthModal();
      return;
    }
    setNewCommentText((prev) => prev + emoji);
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header with Track Information */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={track.coverArtUrl}
              alt={track.title}
              className="w-12 h-12 rounded-lg object-cover shadow-sm flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {track.title}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  {totalCount} comments
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {track.artist} • {track.album}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Mode Restriction Warning Banner */}
        {currentUser.isGuest && (
          <div className="mx-4 mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Guest Mode: Commenting Restricted
              </p>
              <p className="text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                You can browse community comments, but guest users cannot write comments or replies. Sign in to join the conversation!
              </p>
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Sign In or Create Account
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Comments Feed List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-400 opacity-40 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No comments yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Be the first to share your thoughts on this track!
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const isLiked = comment.likedBy.includes(currentUser.id);
              const isAuthor = comment.userId === currentUser.id;

              return (
                <div
                  key={comment.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5 transition-all"
                >
                  {/* Comment Author Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={comment.userAvatar}
                        alt={comment.userName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {comment.userName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            @{comment.username}
                          </span>
                          {comment.isPinned && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                              <Pin className="w-2.5 h-2.5" /> Pinned
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Timestamp Tag */}
                      {comment.trackTimestampSec !== undefined && (
                        <button
                          type="button"
                          onClick={() => onSeekToTimestamp && onSeekToTimestamp(comment.trackTimestampSec!)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-semibold transition-colors"
                          title="Seek to this moment"
                        >
                          <Clock className="w-3 h-3" />
                          {formatTime(comment.trackTimestampSec)}
                        </button>
                      )}

                      {/* Delete button if author */}
                      {(isAuthor || currentUser.role === 'ADMIN') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed pl-10 whitespace-pre-wrap">
                    {comment.text}
                  </p>

                  {/* Comment Action Bar */}
                  <div className="flex items-center gap-4 pl-10 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(comment.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isLiked
                          ? 'text-rose-500 font-semibold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{comment.likesCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser.isGuest) {
                          onOpenAuthModal();
                          return;
                        }
                        setReplyingToId(replyingToId === comment.id ? null : comment.id);
                      }}
                      className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Replies section */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-10 mt-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="text-xs space-y-1 py-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={reply.userAvatar}
                                alt={reply.userName}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {reply.userName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                @{reply.username}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {formatRelativeTime(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 pl-7">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyingToId === comment.id && !currentUser.isGuest && (
                    <div className="ml-10 mt-2 flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to @${comment.username}...`}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handlePostReply(comment.id);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handlePostReply(comment.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90">
          {currentUser.isGuest ? (
            <div className="text-center py-2">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Sign in to post comments or replies
              </button>
            </div>
          ) : (
            <form onSubmit={handlePostComment} className="space-y-2">
              {/* Quick Emojis & Timestamp attachment */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  {['🔥', '❤️', '🎧', '✨', '👏', '🎶'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleQuickEmoji(emoji)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {currentPlaybackTime > 0 && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={includeTimestamp}
                      onChange={(e) => setIncludeTimestamp(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Tag at {formatTime(currentPlaybackTime)}</span>
                  </label>
                )}
              </div>

              {/* Text Input Row */}
              <div className="flex items-center gap-2">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700 flex-shrink-0"
                />
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment on this song..."
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-colors flex-shrink-0"
                  title="Post comment"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
