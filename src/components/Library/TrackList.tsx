import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Heart,
  Clock,
  Lock,
  Download,
  Check,
  Music2,
  Plus,
  ListPlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Share2,
  Tv,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
} from 'lucide-react';
import { Track } from '../../types';
import { commentService } from '../../services/commentService';

interface TrackListProps {
  tracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
  onToggleCacheTrack: (trackId: string) => void;
  onAddToPlaylist?: (track: Track) => void;
  onEnqueueTrack?: (track: Track) => void;
  onOpenComments?: (track: Track) => void;
  onShareTrack?: (track: Track) => void;
  onOpenEmbedPlayer?: (track: Track) => void;
  onDeleteTrack?: (track: Track) => void;
  currentUserId?: string;
  defaultPageSize?: number;
  enablePagination?: boolean;
}

type SortField = 'index' | 'title' | 'artist' | 'duration';
type SortOrder = 'asc' | 'desc';

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onToggleFavorite,
  onToggleCacheTrack,
  onAddToPlaylist,
  onEnqueueTrack,
  onOpenComments,
  onShareTrack,
  onOpenEmbedPlayer,
  onDeleteTrack,
  currentUserId,
  defaultPageSize = 35,
  enablePagination = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sortField, setSortField] = useState<SortField>('index');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // Reset to page 1 whenever the underlying tracks filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tracks.length]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const sortedTracks = useMemo(() => {
    if (sortField === 'index') return tracks;
    return [...tracks].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'artist') {
        comparison = a.artist.localeCompare(b.artist);
      } else if (sortField === 'duration') {
        comparison = a.duration - b.duration;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tracks, sortField, sortOrder]);

  const totalPages = useMemo(() => {
    if (!enablePagination || pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(sortedTracks.length / pageSize));
  }, [enablePagination, pageSize, sortedTracks.length]);

  // Ensure current page is within valid range
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = enablePagination ? (safeCurrentPage - 1) * pageSize : 0;
  const endIndex = enablePagination ? Math.min(startIndex + pageSize, sortedTracks.length) : sortedTracks.length;

  const paginatedTracks = useMemo(() => {
    if (!enablePagination) return sortedTracks;
    return sortedTracks.slice(startIndex, endIndex);
  }, [enablePagination, sortedTracks, startIndex, endIndex]);

  const changePage = (newPage: number) => {
    const target = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(target);
    setJumpPageInput('');
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      changePage(pageNum);
    }
  };

  // Generate pagination buttons with smart range display
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    pages.push(1);

    if (safeCurrentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);

    for (let p = start; p <= end; p++) {
      pages.push(p);
    }

    if (safeCurrentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  }, [safeCurrentPage, totalPages]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (tracks.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-transparent">
        <Music2 className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No tracks found</p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Try adjusting your search query or upload new music files.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Top Pagination Summary & Navigation Header */}
      {enablePagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 py-1 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Showing <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{startIndex + 1}–{endIndex}</strong> of {sortedTracks.length} songs
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Page <strong className="text-slate-900 dark:text-white font-bold">{safeCurrentPage}</strong> of {totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => changePage(safeCurrentPage - 1)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 font-medium shadow-xs cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="px-2.5 py-1 font-mono font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => changePage(safeCurrentPage + 1)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 font-medium shadow-xs cursor-pointer"
              title="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] select-none font-mono">
              <th
                className="py-3 px-3 w-12 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                onClick={() => handleSort('index')}
                title="Sort by catalog index"
              >
                #
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Title & Artist</span>
                  {sortField === 'title' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-3 px-3 hidden md:table-cell">Album</th>
              <th className="py-3 px-3 hidden lg:table-cell">Genre</th>
              <th className="py-3 px-3 hidden sm:table-cell">Format</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                onClick={() => handleSort('duration')}
              >
                <div className="flex items-center justify-end gap-1">
                  <Clock className="w-3.5 h-3.5 inline-block" />
                  {sortField === 'duration' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              </th>
              <th className="py-3 px-3 w-36 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {sortedTracks.length === 0 && (
              <tr>
                <td colSpan={7} className="py-14 px-4 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-inner">
                      <Music2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No matching tracks found</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Try searching for "Coke Studio", "Anuv Jain", "Pasoori", "Husn", or click "All Songs" to view the full library.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {paginatedTracks.map((track, idx) => {
              const isCurrent = currentTrackId === track.id;
              const globalIndex = startIndex + idx + 1;
              return (
                <tr
                  key={track.id}
                  className={`group hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-all ${
                    isCurrent ? 'bg-emerald-50/80 dark:bg-emerald-950/30' : ''
                  }`}
                >
                  {/* Index / Play Button */}
                  <td className="py-3 px-3 text-center text-slate-500 font-mono">
                    <button
                      type="button"
                      onClick={() => onPlayTrack(track)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:text-slate-950 text-slate-500 dark:text-slate-400 mx-auto"
                      title={isCurrent && isPlaying ? 'Pause' : `Play #${globalIndex} - ${track.title}`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400 group-hover:text-white dark:group-hover:text-slate-950" />
                      ) : (
                        <span className="group-hover:hidden text-[11px] font-semibold">{globalIndex}</span>
                      )}
                      <Play className="w-3.5 h-3.5 fill-current hidden group-hover:block ml-0.5" />
                    </button>
                  </td>

                {/* Title, Artist, Cover */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-800 shadow-xs">
                      <img
                        src={track.coverArtUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {track.isPrivate && (
                        <div
                          title="Private to uploader"
                          className="absolute top-0.5 left-0.5 bg-black/80 rounded p-0.5 text-amber-400"
                        >
                          <Lock className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate cursor-pointer hover:underline ${
                          isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-white'
                        }`}
                        onClick={() => onPlayTrack(track)}
                      >
                        {track.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="truncate">{track.artist}</span>
                        {track.uploaderUsername && (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            @{track.uploaderUsername}
                          </span>
                        )}
                        {track.isPrivate && (
                          <span className="text-[10px] bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1 rounded border border-amber-200 dark:border-amber-500/30 font-medium">
                            Private
                          </span>
                        )}
                        {track.category && (
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded font-mono font-medium border border-emerald-200 dark:border-emerald-500/20">
                            {track.category === 'hindi'
                              ? 'Hindi'
                              : track.category === 'punjabi'
                              ? 'Punjabi'
                              : track.category === 'hindi_retro'
                              ? 'Retro'
                              : 'English'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Album */}
                <td className="py-3 px-3 hidden md:table-cell text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                  {track.album}
                </td>

                {/* Genre */}
                <td className="py-3 px-3 hidden lg:table-cell text-slate-700 dark:text-slate-300">
                  <span className="bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 rounded-full text-[11px] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {track.genre}
                  </span>
                </td>

                {/* Format / Bitrate */}
                <td className="py-3 px-3 hidden sm:table-cell font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{track.format}</span>
                  <span className="text-slate-400 dark:text-slate-500 ml-1">({track.bitrateKbps}k)</span>
                </td>

                {/* Duration */}
                <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                  {formatTime(track.duration)}
                </td>

                {/* Actions: Favorite, Cache Offline, Comments, Enqueue, Add to Playlist */}
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(track.id)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        track.isFavorite
                          ? 'text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 bg-rose-50 dark:bg-rose-500/10'
                          : 'text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={track.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleCacheTrack(track.id)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        track.isCachedOffline
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15'
                          : 'text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={
                        track.isCachedOffline
                          ? 'Saved Offline (IndexedDB)'
                          : 'Save track for offline playback'
                      }
                    >
                      {track.isCachedOffline ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {onOpenComments && (
                      <button
                        type="button"
                        onClick={() => onOpenComments(track)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-0.5 cursor-pointer"
                        title="View and post comments on this track"
                        aria-label="Track comments"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {(() => {
                          const realCount = commentService.getCommentCount(track.id);
                          if (realCount > 0) {
                            return (
                              <span className="text-[10px] font-mono font-semibold ml-0.5 text-emerald-600 dark:text-emerald-400">
                                {realCount}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </button>
                    )}

                    {onShareTrack && (
                      <button
                        type="button"
                        onClick={() => onShareTrack(track)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Share & Listen Together (Generate Room URL with ?room & ?track)"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onOpenEmbedPlayer && (
                      <button
                        type="button"
                        onClick={() => onOpenEmbedPlayer(track)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Watch & Listen to Original Track on YouTube / Spotify"
                      >
                        <Tv className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onEnqueueTrack && (
                      <button
                        type="button"
                        onClick={() => onEnqueueTrack(track)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Add to queue (play next)"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onAddToPlaylist && (
                      <button
                        type="button"
                        onClick={() => onAddToPlaylist(track)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Add to playlist"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onDeleteTrack && (track.uploaderId === currentUserId || track.uploaderUsername === 'aloks0519' || !track.id.startsWith('trk_curated_')) && (
                      <button
                        type="button"
                        onClick={() => onDeleteTrack(track)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        title="Delete track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* Responsive Bottom Pagination Controls */}
    {enablePagination && (
      <div className="pt-4 pb-2 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs select-none">
        {/* Left: Summary & Per-Page Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Showing <span className="text-emerald-600 dark:text-emerald-400 font-bold">{startIndex + 1}–{endIndex}</span> of {sortedTracks.length} songs
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value={35}>35 songs (Default)</option>
              <option value={50}>50 songs</option>
              <option value={75}>75 songs</option>
              <option value={100}>100 songs</option>
              <option value={sortedTracks.length}>All songs ({sortedTracks.length})</option>
            </select>
          </div>
        </div>

        {/* Center: Numbered Page Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center flex-wrap justify-center gap-1">
            {/* First Page */}
            <button
              type="button"
              onClick={() => changePage(1)}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Previous Page */}
            <button
              type="button"
              onClick={() => changePage(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition font-medium flex items-center gap-1 cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Numbered Page Buttons with Explicit Labels: Page 1, Page 2, Page 3 */}
            <div className="flex items-center gap-1">
              {pageNumbers.map((page, idx) => {
                if (page === 'ellipsis') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 select-none">
                      •••
                    </span>
                  );
                }

                const isActive = page === safeCurrentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => changePage(page)}
                    className={`min-w-[34px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-md scale-105'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs'
                    }`}
                    title={`Go to Page ${page}`}
                  >
                    {page <= 3 ? `Page ${page}` : page}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              type="button"
              onClick={() => changePage(safeCurrentPage + 1)}
              disabled={safeCurrentPage >= totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition font-medium flex items-center gap-1 cursor-pointer"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => changePage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Quick Jump Form */}
        {totalPages > 2 && (
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5 text-slate-500">
            <span className="hidden sm:inline">Go to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              placeholder={String(safeCurrentPage)}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              className="w-14 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Go
            </button>
          </form>
        )}
      </div>
    )}
  </div>
  );
};

