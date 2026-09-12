import React, { useState } from 'react';
import {
  X,
  DownloadCloud,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Track } from '../../types';
import { musicApiService } from '../../services/musicApiService';
import { CURATED_CATALOG } from '../../data/curatedMusicCatalog';

interface MusicFeedImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplaceFeedWithCurated: (newTracks: Track[]) => void;
  onAppendTracksToFeed: (tracksToAdd: Track[]) => void;
  onPlayPreviewTrack?: (track: Track) => void;
}

export const MusicFeedImporterModal: React.FC<MusicFeedImporterModalProps> = ({
  isOpen,
  onClose,
  onReplaceFeedWithCurated,
}) => {
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClearAndLoadCurated = () => {
    const curated = musicApiService.clearAndLoadCuratedFeed();
    onReplaceFeedWithCurated(curated);
    setStatusNotification(`Successfully loaded 370 curated songs across English, Hindi, Punjabi, and Retro!`);
    setTimeout(() => {
      setStatusNotification(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                370+ Songs Feed
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Load curated English Hits, Bollywood Hindi, Punjabi Chartbusters, and Hindi Retro Classics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification */}
        {statusNotification && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
            <span className="font-medium">{statusNotification}</span>
            <button type="button" onClick={() => setStatusNotification(null)} className="hover:opacity-75 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Catalog 370+ Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Ready-to-Load Master Feed
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Load 370 Most-Listened Hits
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                  Populate your We Music feed with 370 iconic, popular hits categorized across English Global, Bollywood Hindi, Punjabi Chartbusters, and Hindi Golden Era Retro.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearAndLoadCurated}
                className="w-full md:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Load 370+ Songs Feed
              </button>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">115</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">English Pop & Hits</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">The Weeknd, Taylor Swift, Drake, etc.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-lg font-extrabold text-teal-600 dark:text-teal-400">100</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Hindi Bollywood</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Arijit Singh, Shreya Ghoshal, KK, Pritam</p>
              </div>

              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-lg font-extrabold text-cyan-600 dark:text-cyan-400">80</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Punjabi Chartbusters</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Diljit Dosanjh, AP Dhillon, Karan Aujla</p>
              </div>

              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">75</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Hindi Retro Classics</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Kishore Kumar, Lata, Rafi, RD Burman</p>
              </div>
            </div>
          </div>

          {/* Catalog Sample Preview List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Catalog Highlights ({CURATED_CATALOG.length} Tracks Ready)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {CURATED_CATALOG.slice(0, 18).map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3"
                >
                  <img
                    src={t.coverArtUrl}
                    alt={t.title}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.artist}</p>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono uppercase">
                      {t.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
