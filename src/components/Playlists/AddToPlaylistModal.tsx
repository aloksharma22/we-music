import React, { useState } from 'react';
import { X, Plus, Check, Music, FolderPlus, Globe, Lock } from 'lucide-react';
import { Playlist, Track } from '../../types';

interface AddToPlaylistModalProps {
  track: Track | null;
  playlists: Playlist[];
  onClose: () => void;
  onToggleTrackInPlaylist: (playlistId: string, track: Track) => void;
  onCreatePlaylistAndAdd: (title: string, track: Track, isPrivate?: boolean) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  playlists,
  onClose,
  onToggleTrackInPlaylist,
  onCreatePlaylistAndAdd,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!track) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylistAndAdd(newTitle.trim(), track, isPrivate);
    setNewTitle('');
    setShowCreateForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Add to Playlist</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Track Preview */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <img
            src={track.coverArtUrl}
            alt={track.title}
            className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shadow-xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{track.title}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{track.artist}</p>
          </div>
        </div>

        {/* Playlist List */}
        <div className="p-4 max-h-64 overflow-y-auto space-y-1.5">
          {playlists.length === 0 ? (
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 py-4">
              No playlists found. Create one below!
            </p>
          ) : (
            playlists.map((pl) => {
              const isInPlaylist = pl.trackIds.includes(track.id);
              return (
                <div
                  key={pl.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <img
                      src={pl.coverArtUrl}
                      alt={pl.title}
                      className="w-8 h-8 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{pl.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {pl.trackIds.length} tracks
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleTrackInPlaylist(pl.id, track)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                      isInPlaylist
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isInPlaylist ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Quick New Playlist Creator */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40">
          {showCreateForm ? (
            <form onSubmit={handleCreate} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New playlist name..."
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-semibold rounded-lg text-xs hover:bg-emerald-500 transition cursor-pointer"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>

              {/* Public / Private Choice */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    !isPrivate
                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    isPrivate
                      ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </button>
                <span className="text-[10px] text-slate-400 font-mono ml-auto">
                  {!isPrivate ? 'Public community playlist' : 'Private to your account'}
                </span>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition border border-dashed border-emerald-500/30"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create New Playlist with this Track</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
