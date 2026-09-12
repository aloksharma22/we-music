import React, { useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Maximize2,
  ListMusic,
  Sliders,
  Radio,
  Lock,
  Download,
  MessageSquare,
  Tv
} from 'lucide-react';
import { PlayerState, Track } from '../../types';
import { audioEngine } from '../../services/audioEngine';
import { commentService } from '../../services/commentService';

interface BottomPlayerProps {
  playerState: PlayerState;
  onPlayToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onCrossfadeChange: (seconds: number) => void;
  onToggleQueue: () => void;
  onToggleFullScreen: () => void;
  onToggleCacheTrack?: (trackId: string) => void;
  onOpenComments?: (track: Track) => void;
  onOpenEmbedPlayer?: (track: Track) => void;
  onToggleAutoplay?: () => void;
  showQueue: boolean;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({
  playerState,
  onPlayToggle,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onShuffleToggle,
  onRepeatToggle,
  onPlaybackRateChange,
  onCrossfadeChange,
  onToggleQueue,
  onToggleFullScreen,
  onToggleCacheTrack,
  onOpenComments,
  onOpenEmbedPlayer,
  onToggleAutoplay,
  showQueue,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const track = playerState.currentTrack;

  // Mini canvas waveform visualizer
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const data = audioEngine.getFrequencyData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 18;
      const barWidth = 3;
      const spacing = 2;
      const totalW = barCount * (barWidth + spacing);
      const startX = (canvas.width - totalW) / 2;

      for (let i = 0; i < barCount; i++) {
        const val = playerState.isPlaying ? data[i * 2] || 10 : 8;
        const barHeight = Math.max(3, (val / 255) * canvas.height * 0.9);
        const x = startX + i * (barWidth + spacing);
        const y = canvas.height - barHeight;

        ctx.fillStyle = playerState.isPlaying ? '#10b981' : '#64748b';
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerState.isPlaying]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!track) {
    return (
      <footer id="bottom-audio-player" className="fixed bottom-0 left-0 right-0 z-40 h-20 border-t border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-xl px-6 flex items-center justify-between text-slate-500 dark:text-slate-400 shadow-2xl transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-inner">
            <Radio className="w-5 h-5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Ready to Stream</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select any song from Coke Studio, Anuv Jain, or the community catalog</p>
          </div>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
          Direct Audio Stream Active • 320 kbps FLAC / AAC
        </div>
      </footer>
    );
  }

  const progressPercent = track.duration > 0 ? (playerState.currentTime / track.duration) * 100 : 0;

  return (
    <footer id="bottom-audio-player" className="fixed bottom-0 left-0 right-0 z-40 h-22 border-t border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-xl px-4 md:px-6 flex flex-col justify-center relative select-none shadow-2xl transition-colors">
      {/* Interactive Progress Bar */}
      <div
        className="group absolute -top-1.5 left-0 right-0 h-3 cursor-pointer flex items-center"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          onSeek(ratio * track.duration);
        }}
      >
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 group-hover:h-2 transition-all">
          <div
            className="h-full bg-emerald-500 relative transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-slate-300 dark:border-transparent rounded-full opacity-0 group-hover:opacity-100 shadow-md transform translate-x-1/2" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 md:gap-4 mt-1">
        {/* Track Metadata & Cover */}
        <div className="flex items-center gap-3 min-w-[200px] max-w-[260px] md:max-w-[320px]">
          <div className="relative group/cover w-13 h-13 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-xs">
            <img
              src={track.coverArtUrl}
              alt={track.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {track.isPrivate && (
              <span title="Private Track (uploader only)" className="absolute top-1 left-1 bg-black/80 p-0.5 rounded text-amber-400">
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{track.title}</p>
              <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded shrink-0 border border-emerald-500/30 font-semibold">
                {track.format}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">{track.artist}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{track.album}</p>
          </div>
        </div>

        {/* Center: Controls & Timestamps */}
        <div className="flex flex-col items-center gap-1 flex-1 max-w-xl">
          <div className="flex items-center gap-2 md:gap-3.5">
            {/* Autoplay Next Button */}
            {onToggleAutoplay && (
              <button
                id="player-autoplay-btn"
                type="button"
                onClick={onToggleAutoplay}
                title={playerState.autoplayNext !== false ? 'Autoplay Next: ON' : 'Autoplay Next: OFF'}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition cursor-pointer flex items-center gap-1 ${
                  playerState.autoplayNext !== false
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'
                }`}
              >
                <span>AUTO</span>
                <span className={`w-1.5 h-1.5 rounded-full ${playerState.autoplayNext !== false ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-400 dark:bg-slate-600'}`} />
              </button>
            )}

            <button
              id="player-shuffle-btn"
              type="button"
              onClick={onShuffleToggle}
              title={playerState.isShuffled ? 'Shuffle ON (Randomized order)' : 'Shuffle OFF'}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                playerState.isShuffled ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              id="player-prev-btn"
              type="button"
              onClick={onPrev}
              title="Previous Track"
              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              id="player-play-pause-btn"
              type="button"
              onClick={onPlayToggle}
              className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center hover:bg-emerald-400 hover:scale-105 active:scale-95 transition shadow-lg shadow-emerald-500/25 cursor-pointer font-bold"
              title={playerState.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {playerState.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              id="player-next-btn"
              type="button"
              onClick={onNext}
              title="Next Track"
              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              id="player-repeat-btn"
              type="button"
              onClick={onRepeatToggle}
              title={
                playerState.repeatMode === 'one'
                  ? 'Loop Current Track (Repeat One)'
                  : playerState.repeatMode === 'all'
                  ? 'Repeat All (Loop Playlist)'
                  : 'Repeat Off'
              }
              className={`p-1.5 rounded-full transition relative cursor-pointer ${
                playerState.repeatMode !== 'off'
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {playerState.repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              {playerState.repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[8px] bg-emerald-500 text-slate-950 px-1 rounded-full font-black">1</span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono w-full justify-center">
            <span>{formatTime(playerState.currentTime)}</span>
            <div className="hidden sm:block">
              <canvas ref={canvasRef} width={80} height={14} className="opacity-90" />
            </div>
            <span>{formatTime(track.duration)}</span>
          </div>
        </div>

        {/* Right Controls: Speed, Crossfade, Volume, Queue & Fullscreen */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Crossfade Selector */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded">
            <Sliders className="w-3 h-3 text-slate-500" />
            <select
              id="crossfade-selector"
              value={playerState.crossfadeDuration}
              onChange={(e) => onCrossfadeChange(Number(e.target.value))}
              className="bg-transparent text-slate-700 dark:text-slate-300 text-xs focus:outline-none cursor-pointer"
              title="Crossfade transition duration between tracks"
            >
              <option value="0" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Fade: Off</option>
              <option value="2" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Fade: 2s</option>
              <option value="4" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Fade: 4s</option>
              <option value="8" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Fade: 8s</option>
            </select>
          </div>

          {/* Speed Selector */}
          <div className="hidden xl:flex items-center text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded">
            <select
              id="speed-selector"
              value={playerState.playbackRate}
              onChange={(e) => onPlaybackRateChange(Number(e.target.value))}
              className="bg-transparent text-slate-700 dark:text-slate-300 text-xs focus:outline-none cursor-pointer"
              title="Playback speed"
            >
              <option value="0.75" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">0.75x</option>
              <option value="1.0" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">1.0x</option>
              <option value="1.25" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">1.25x</option>
              <option value="1.5" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">1.5x</option>
            </select>
          </div>

          {/* Offline Cache Indicator */}
          {onToggleCacheTrack && (
            <button
              id="player-offline-cache-btn"
              type="button"
              onClick={() => onToggleCacheTrack(track.id)}
              title={track.isCachedOffline ? 'Available Offline (Encrypted in IndexedDB)' : 'Cache for Offline Listening'}
              className={`hidden sm:flex p-1.5 rounded transition ${
                track.isCachedOffline ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-950/30' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              id="player-mute-btn"
              type="button"
              onClick={onMuteToggle}
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
              title={playerState.isMuted ? 'Unmute' : 'Mute'}
            >
              {playerState.isMuted || playerState.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              id="player-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={playerState.isMuted ? 0 : playerState.volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-16 md:w-20 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
              title={`Volume: ${Math.round((playerState.isMuted ? 0 : playerState.volume) * 100)}%`}
            />
          </div>

          {/* Comments Button */}
          {track && onOpenComments && (
            <button
              id="player-comments-btn"
              type="button"
              onClick={() => onOpenComments(track)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900 rounded-lg transition relative"
              title="Track Comments & Community Discussion"
            >
              <MessageSquare className="w-4 h-4" />
              {(() => {
                const realCount = commentService.getCommentCount(track.id);
                if (realCount > 0) {
                  return (
                    <span className="absolute -top-1 -right-1 px-1 py-0.2 min-w-[14px] h-3.5 bg-emerald-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                      {realCount}
                    </span>
                  );
                }
                return null;
              })()}
            </button>
          )}

          {/* YouTube / Spotify Embed Video Player */}
          {track && onOpenEmbedPlayer && (
            <button
              id="player-embed-modal-btn"
              type="button"
              onClick={() => onOpenEmbedPlayer(track)}
              className="px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold bg-red-600/10 text-red-600 hover:bg-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 border border-red-500/20 shadow-sm"
              title="Watch & Listen to Original Track on YouTube / Spotify"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">YouTube / Spotify</span>
            </button>
          )}

          {/* Queue Toggle */}
          <button
            id="player-queue-toggle-btn"
            type="button"
            onClick={onToggleQueue}
            className={`p-2 rounded-lg transition ${
              showQueue
                ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900'
            }`}
            title="Toggle Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Full Screen Player */}
          <button
            id="player-fullscreen-btn"
            type="button"
            onClick={onToggleFullScreen}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900 rounded-lg transition"
            title="Full Screen Visualizer Mode (F)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
