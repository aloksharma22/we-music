import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Minimize2,
  Maximize2,
  Tv,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Music2,
  Radio,
  Check
} from 'lucide-react';
import { Track } from '../../types';

interface EmbedPlayerModalProps {
  track: Track | null;
  isOpen: boolean;
  isPlaying?: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onTogglePlay?: () => void;
  onPauseNativeAudio?: () => void;
  initialPip?: boolean;
}

export const EmbedPlayerModal: React.FC<EmbedPlayerModalProps> = ({
  track,
  isOpen,
  isPlaying = true,
  onClose,
  onPrev,
  onNext,
  onTogglePlay,
  onPauseNativeAudio,
  initialPip = true,
}) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'spotify' | 'audio'>('youtube');
  const [isPip, setIsPip] = useState<boolean>(initialPip);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // When YouTube player opens or active, pause native procedural synthesizer to prevent dual audio
  useEffect(() => {
    if (isOpen && onPauseNativeAudio) {
      onPauseNativeAudio();
    }
  }, [isOpen, onPauseNativeAudio, track?.id]);

  // Sync postMessage play/pause with YouTube iframe
  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('#youtube-embed-iframe');
    if (iframe && iframe.contentWindow) {
      const func = isPlaying ? 'playVideo' : 'pauseVideo';
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
      } catch {
        // ignore
      }
    }
  }, [isPlaying]);

  if (!isOpen || !track) return null;

  const youtubeId = track.youtubeId;
  const youtubeEmbedUrl = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&rel=0`
    : null;
  const youtubeWatchUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(track.artist + ' ' + track.title + ' official audio')}`;

  const spotifySearchUrl =
    track.spotifyUrl ||
    `https://open.spotify.com/search/${encodeURIComponent(track.artist + ' ' + track.title)}`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(youtubeWatchUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Render PiP (Picture in Picture / Floating Dock)
  if (isPip) {
    return (
      <div
        id="embed-player-pip-container"
        className="fixed bottom-24 right-4 z-50 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-md transition-all duration-300"
      >
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/50 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-semibold text-white truncate">{track.title}</span>
            <span className="text-slate-400 truncate">• {track.artist}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsPip(false)}
              className="p-1 text-slate-400 hover:text-white transition rounded"
              title="Expand Player"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition rounded"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="relative aspect-video bg-black">
          {youtubeEmbedUrl ? (
            <iframe
              id="youtube-embed-iframe"
              src={youtubeEmbedUrl}
              title={`${track.title} - Official Video`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <Tv className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-xs text-slate-300">Searching YouTube for official video...</p>
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                Watch on YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* PiP Control Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            {onPrev && (
              <button
                type="button"
                onClick={onPrev}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                title="Previous track"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
            )}
            {onTogglePlay && (
              <button
                type="button"
                onClick={onTogglePlay}
                className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                title="Next track"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={spotifySearchUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#1DB954] hover:underline flex items-center gap-1 text-[11px] font-medium"
              title="Open track on Spotify"
            >
              <Music2 className="w-3 h-3" />
              <span>Spotify</span>
            </a>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              YouTube HD
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Modal
  return (
    <div
      id="embed-player-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="embed-player-dialog"
        className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900/90 border-b border-slate-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={track.coverArtUrl}
              alt={track.title}
              className="w-10 h-10 rounded-lg object-cover shadow border border-slate-700/50 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">{track.title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Original Track
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{track.artist} • {track.album}</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('youtube')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'youtube'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">YouTube</span> Video
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('spotify')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'spotify'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Spotify</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'audio'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stream Audio</span>
            </button>
          </div>

          {/* Window Actions */}
          <div className="flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={() => setIsPip(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Minimize to Floating Corner Player (PiP)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[360px]">
          {activeTab === 'youtube' && (
            <div className="w-full max-w-3xl flex flex-col items-center">
              <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-slate-800 relative">
                {youtubeEmbedUrl ? (
                  <iframe
                    id="youtube-embed-iframe"
                    src={youtubeEmbedUrl}
                    title={`${track.title} by ${track.artist} - Official Video`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <Tv className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
                    <h4 className="text-base font-semibold text-white mb-1">
                      Finding Official YouTube Video...
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mb-4">
                      Direct embed link is generating. You can stream instantly on YouTube:
                    </p>
                    <a
                      href={youtubeWatchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition shadow-lg shadow-red-600/30"
                    >
                      Open Video on YouTube <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* YouTube Metadata & Deep Links */}
              <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-900/70 px-4 py-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300 font-medium">Licensed YouTube Streaming Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="hover:text-white transition inline-flex items-center gap-1 text-slate-300"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Link!
                      </>
                    ) : (
                      'Share Track Link'
                    )}
                  </button>
                  <a
                    href={youtubeWatchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-400 hover:text-red-300 font-medium inline-flex items-center gap-1 transition"
                  >
                    Watch in YouTube App <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'spotify' && (
            <div className="w-full max-w-lg flex flex-col items-center text-center p-6 bg-slate-900 rounded-2xl border border-slate-800">
              <img
                src={track.coverArtUrl}
                alt={track.title}
                className="w-44 h-44 rounded-2xl object-cover shadow-2xl mb-5 border-2 border-emerald-500/30"
              />
              <h4 className="text-xl font-bold text-white mb-1">{track.title}</h4>
              <p className="text-sm text-slate-400 mb-4">{track.artist} • {track.album} ({track.releaseYear})</p>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 w-full mb-5 text-left text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Audio Format:</span>
                  <span className="font-semibold text-emerald-400">Spotify High Quality (Ogg Vorbis 320kbps)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Copyright / Rights:</span>
                  <span>Licensed via Spotify Music</span>
                </div>
              </div>

              <a
                href={spotifySearchUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-6 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm inline-flex items-center justify-center gap-2 transition shadow-lg shadow-[#1DB954]/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Music2 className="w-5 h-5 fill-current" />
                Listen on Spotify (App / Web)
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
              <p className="text-[11px] text-slate-500 mt-3">
                Opens directly in your installed Spotify app or Spotify Web Player
              </p>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="w-full max-w-lg flex flex-col items-center text-center p-6 bg-slate-900 rounded-2xl border border-slate-800">
              <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400">
                <Radio className="w-10 h-10 animate-pulse" />
              </div>
              <h4 className="text-lg font-bold text-white mb-1">Direct Audio Stream</h4>
              <p className="text-xs text-slate-400 mb-5">
                {track.title} by {track.artist}
              </p>

              <div className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-2 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stream Source:</span>
                  <span className="text-emerald-400 font-mono">
                    {track.previewAudioUrl ? 'Studio Audio Preview (AAC 256k)' : 'Built-in Harmonic Synthesizer'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bitrate:</span>
                  <span className="font-mono">{track.bitrateKbps} kbps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Audio Preset:</span>
                  <span className="capitalize font-mono">{track.audioPreset}</span>
                </div>
              </div>

              {track.previewAudioUrl ? (
                <audio
                  controls
                  autoPlay
                  src={track.previewAudioUrl}
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="text-xs text-slate-400 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                  Native procedural synthesizer is currently active for this track in the main bottom player.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Track Controls */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            {onPrev && (
              <button
                type="button"
                onClick={onPrev}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 text-center">
            {track.title} <span className="text-slate-500">•</span> {track.artist}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
