import React, { useState } from 'react';
import {
  X,
  Play,
  Users,
  UserPlus,
  Share2,
  Copy,
  Lock,
  Globe,
  Trash2,
  Edit2,
  Music,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Playlist, Track, PlaylistAccessRole, UserProfile } from '../../types';
import { TrackList } from '../Library/TrackList';

interface PlaylistDetailModalProps {
  playlist: Playlist;
  allTracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  currentUser?: UserProfile;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
  onToggleCacheTrack: (trackId: string) => void;
  onDuplicatePlaylist: (playlist: Playlist) => void;
  onUpdateCollaboratorRole: (playlistId: string, userId: string, newRole: PlaylistAccessRole) => void;
  onAddCollaborator: (playlistId: string, email: string, role: PlaylistAccessRole) => void;
  onRemoveTrackFromPlaylist?: (playlistId: string, trackId: string) => void;
  onEditPlaylist?: (playlistId: string, newTitle: string, newDescription: string) => void;
  onTogglePrivacy?: (playlistId: string) => void;
  onSharePlaylist?: (playlist: Playlist) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  onEnqueueTrack?: (track: Track) => void;
  onOpenEmbedPlayer?: (track: Track) => void;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  playlist,
  allTracks,
  currentTrackId,
  isPlaying,
  currentUser,
  onClose,
  onPlayTrack,
  onToggleFavorite,
  onToggleCacheTrack,
  onDuplicatePlaylist,
  onUpdateCollaboratorRole,
  onAddCollaborator,
  onRemoveTrackFromPlaylist,
  onEditPlaylist,
  onTogglePrivacy,
  onSharePlaylist,
  onDeletePlaylist,
  onEnqueueTrack,
  onOpenEmbedPlayer,
}) => {
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>(playlist.title);
  const [editDesc, setEditDesc] = useState<string>(playlist.description);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<PlaylistAccessRole>('CONTRIBUTOR');
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const playlistTracks = playlist.trackIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter((t): t is Track => Boolean(t));

  const formatTotalTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    return `${mins} min`;
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    if (onEditPlaylist) {
      onEditPlaylist(playlist.id, editTitle.trim(), editDesc.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDeletePlaylist) {
      onDeletePlaylist(playlist.id);
      onClose();
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    onAddCollaborator(playlist.id, inviteEmail, inviteRole);
    setInviteEmail('');
  };

  const isOwner = currentUser ? playlist.ownerId === currentUser.id : true;

  const copyShareLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shareUrl = `${origin}${pathname}?playlist=${encodeURIComponent(playlist.id)}`;
    try {
      navigator.clipboard.writeText(shareUrl);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
    setShareCopied(true);
    if (onSharePlaylist) {
      onSharePlaylist(playlist);
    }
    setTimeout(() => setShareCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header Banner */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={playlist.coverArtUrl}
              alt={playlist.title}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shadow-md border border-slate-200 dark:border-slate-800 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  {playlist.isCollaborative ? 'Collaborative Playlist' : 'Personal Playlist'}
                </span>
                {isOwner && onTogglePrivacy ? (
                  <button
                    type="button"
                    onClick={() => onTogglePrivacy(playlist.id)}
                    className={`text-xs flex items-center gap-1 font-medium px-2 py-0.5 rounded-full cursor-pointer transition ${
                      playlist.isPrivate
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                    }`}
                    title={playlist.isPrivate ? 'Private: Click to make Public' : 'Public: Click to make Private'}
                  >
                    {playlist.isPrivate ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Private (Only You)</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3" />
                        <span>Public (Community)</span>
                      </>
                    )}
                  </button>
                ) : playlist.isPrivate ? (
                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveEdit} className="space-y-2 mt-1">
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-sm text-slate-900 dark:text-white font-bold"
                    placeholder="Playlist title"
                  />
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300"
                    placeholder="Playlist description"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-500"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {playlist.title}
                    </h2>
                    {onEditPlaylist && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Edit Playlist Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">{playlist.description}</p>
                </>
              )}

              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span>
                  Curated by {playlist.ownerName}
                  {playlist.ownerUsername ? ` (@${playlist.ownerUsername})` : ''}
                </span>
                <span>•</span>
                <span>{playlistTracks.length} tracks</span>
                <span>•</span>
                <span>{formatTotalTime(playlist.totalDuration)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {playlistTracks.length > 0 && (
              <button
                type="button"
                onClick={() => onPlayTrack(playlistTracks[0])}
                className="w-10 h-10 rounded-full bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 flex items-center justify-center shadow transition"
                title="Play Playlist"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            )}

            {/* Public Share URL Button or Owner Privacy Control */}
            {!playlist.isPrivate ? (
              <button
                type="button"
                onClick={copyShareLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 transition border border-emerald-500/30 text-xs font-semibold shadow-xs cursor-pointer"
                title="Share Public Playlist URL (Anyone can view and listen)"
              >
                {shareCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Share URL</span>
                  </>
                )}
              </button>
            ) : isOwner ? (
              <button
                type="button"
                onClick={() => onTogglePrivacy && onTogglePrivacy(playlist.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 transition border border-amber-500/30 text-xs font-medium cursor-pointer"
                title="Private Playlist (Only you can access). Click to make it Public and shareable"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Make Public</span>
              </button>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-mono"
                title="Private Playlist: Only the creator can access"
              >
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </div>
            )}

            {/* If owner and public, quick button to switch to private */}
            {!playlist.isPrivate && isOwner && onTogglePrivacy && (
              <button
                type="button"
                onClick={() => onTogglePrivacy(playlist.id)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="Make Private (Restrict access exclusively to your account)"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowShareModal(!showShareModal)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700 font-medium"
            >
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Collaborators ({playlist.collaborators.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onDuplicatePlaylist(playlist)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition border border-slate-200 dark:border-slate-700"
              title="Duplicate Playlist"
            >
              <Copy className="w-4 h-4" />
            </button>

            {onDeletePlaylist && (
              confirmDelete ? (
                <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-2 py-1 bg-rose-600 text-white text-[11px] font-semibold rounded"
                  >
                    Delete?
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-1 text-slate-500 text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-500 hover:text-rose-600 transition border border-slate-200 dark:border-slate-700"
                  title="Delete Playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collaborator Drawer (when open) */}
        {showShareModal && (
          <div className="p-4 bg-slate-100/70 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Shared Playlist Collaborator Management
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Assign Owner, Editor, Contributor, or Read-Only Viewer rights to community members.
                </p>
              </div>
              <button
                type="button"
                onClick={copyShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs font-medium"
              >
                {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{shareCopied ? 'Link Copied!' : 'Copy Invite Link'}</span>
              </button>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-2 mb-4">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="community.member@domain.internal"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 flex-1 min-w-[220px]"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as PlaylistAccessRole)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
              >
                <option value="VIEWER">Read-Only Viewer</option>
                <option value="CONTRIBUTOR">Contributor (Add tracks)</option>
                <option value="EDITOR">Editor (Add/reorder/remove)</option>
              </select>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </form>

            {/* Collaborators List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {playlist.collaborators.map((c) => (
                <div
                  key={c.userId}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={c.userAvatar} alt={c.userName} className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                    <div className="truncate">
                      <p className="text-slate-900 dark:text-slate-200 font-medium truncate">{c.userName}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                        @{c.username || c.userName.toLowerCase().replace(/[^a-z0-9_]/g, '')}
                      </p>
                    </div>
                  </div>
                  <select
                    value={c.role}
                    disabled={c.role === 'OWNER'}
                    onChange={(e) => onUpdateCollaboratorRole(playlist.id, c.userId, e.target.value as PlaylistAccessRole)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono disabled:opacity-60"
                  >
                    <option value="OWNER">OWNER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracks List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {playlistTracks.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Music className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium">This playlist is empty</p>
              <p className="text-xs text-slate-400 mt-1">Browse tracks in your library and click &quot;+&quot; to add them here.</p>
            </div>
          ) : (
            <TrackList
              tracks={playlistTracks}
              currentTrackId={currentTrackId}
              isPlaying={isPlaying}
              onPlayTrack={onPlayTrack}
              onToggleFavorite={onToggleFavorite}
              onToggleCacheTrack={onToggleCacheTrack}
              onEnqueueTrack={onEnqueueTrack}
              onOpenEmbedPlayer={onOpenEmbedPlayer}
            />
          )}
        </div>
      </div>
    </div>
  );
};
