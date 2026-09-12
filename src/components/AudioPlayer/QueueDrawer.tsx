import React from 'react';
import { X, Trash2, Play, Music, Radio } from 'lucide-react';
import { Track } from '../../types';

interface QueueDrawerProps {
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  currentTrack,
  queue,
  history,
  onClose,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
}) => {
  return (
    <aside
      id="queue-sidebar-drawer"
      className="fixed right-0 top-16 bottom-22 w-80 md:w-96 bg-white/95 dark:bg-slate-950/95 border-l border-slate-200 dark:border-slate-800 backdrop-blur-xl z-30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 text-slate-900 dark:text-slate-100 transition-colors"
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Playback Queue</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">
            {queue.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              type="button"
              onClick={onClearQueue}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition font-medium"
              title="Clear upcoming queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Now Playing */}
        {currentTrack && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-mono">
              Now Playing
            </p>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 shadow-sm">
              <img
                src={currentTrack.coverArtUrl}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-lg object-cover border border-emerald-200 dark:border-transparent"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 truncate">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">{currentTrack.artist}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>{currentTrack.format}</span>
                  <span>•</span>
                  <span>{Math.floor(currentTrack.duration / 60)}:{(currentTrack.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse shrink-0" />
            </div>
          </div>
        )}

        {/* Up Next */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-mono">
            Up Next
          </p>
          {queue.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-transparent">
              Queue is empty. Select songs to enqueue or enable auto-play.
            </div>
          ) : (
            <div className="space-y-1.5">
              {queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition"
                >
                  <div
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    onClick={() => onPlayTrack(track)}
                  >
                    <span className="text-xs text-slate-400 dark:text-slate-500 w-4 font-mono">{idx + 1}</span>
                    <img
                      src={track.coverArtUrl}
                      alt={track.title}
                      className="w-9 h-9 rounded-md object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => onPlayTrack(track)}
                      className="p-1 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                      title="Play now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveFromQueue(idx)}
                      className="p-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                      title="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Played */}
        {history.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-mono">
              Recently Played
            </p>
            <div className="space-y-1 opacity-90">
              {history.slice(0, 5).map((track, i) => (
                <div
                  key={`hist-${track.id}-${i}`}
                  onClick={() => onPlayTrack(track)}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer text-xs transition"
                >
                  <img
                    src={track.coverArtUrl}
                    alt={track.title}
                    className="w-7 h-7 rounded-md object-cover border border-slate-200 dark:border-slate-800"
                  />
                  <div className="truncate">
                    <span className="text-slate-800 dark:text-slate-300 truncate block font-medium">{track.title}</span>
                    <span className="text-slate-500 dark:text-slate-500 text-[10px]">{track.artist}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
