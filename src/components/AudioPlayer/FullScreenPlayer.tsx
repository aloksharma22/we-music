import React, { useRef, useEffect } from 'react';
import {
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Lock,
  Radio,
  FileMusic,
  ShieldCheck,
  Download,
  MessageSquare,
  Tv
} from 'lucide-react';
import { PlayerState, Track } from '../../types';
import { audioEngine } from '../../services/audioEngine';
import { commentService } from '../../services/commentService';
import { WeMusicLogo } from '../Common/WeMusicLogo';

interface FullScreenPlayerProps {
  playerState: PlayerState;
  onClose: () => void;
  onPlayToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  onOpenComments?: (track: Track) => void;
  onOpenEmbedPlayer?: (track: Track) => void;
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
  playerState,
  onClose,
  onPlayToggle,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onShuffleToggle,
  onRepeatToggle,
  onOpenComments,
  onOpenEmbedPlayer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const track = playerState.currentTrack;

  // Real-time canvas visualizer with frequency bars
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const data = audioEngine.getFrequencyData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 36;
      const barWidth = 6;
      const gap = 4;
      const totalWidth = barCount * (barWidth + gap);
      const startX = (canvas.width - totalWidth) / 2;

      for (let i = 0; i < barCount; i++) {
        const value = playerState.isPlaying ? data[i] || 15 : 10;
        const barHeight = Math.max(6, (value / 255) * canvas.height * 0.85);
        const x = startX + i * (barWidth + gap);
        const y = canvas.height - barHeight;

        // Gradient color for bars
        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#34d399');
        grad.addColorStop(1, '#059669');

        ctx.fillStyle = playerState.isPlaying ? grad : '#475569';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerState.isPlaying]);

  if (!track) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = track.duration > 0 ? (playerState.currentTime / track.duration) * 100 : 0;

  return (
    <div
      id="fullscreen-audio-modal"
      className="fixed inset-0 z-50 bg-slate-50/98 dark:bg-slate-950/98 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-6 md:p-12 overflow-hidden backdrop-blur-xl animate-in fade-in duration-200 transition-colors"
    >
      {/* Blurred background glow */}
      <div
        className="absolute inset-0 opacity-15 dark:opacity-20 pointer-events-none bg-cover bg-center filter blur-3xl scale-125"
        style={{ backgroundImage: `url(${track.coverArtUrl})` }}
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WeMusicLogo size="sm" />
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">• HLS 256kbps Master Stream</span>
        </div>

        <div className="flex items-center gap-2">
          {track && onOpenComments && (
            <button
              type="button"
              onClick={() => onOpenComments(track)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition"
              title="View & post comments on this track"
            >
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Comments</span>
              {(() => {
                const realCount = commentService.getCommentCount(track.id);
                if (realCount > 0) {
                  return (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                      {realCount}
                    </span>
                  );
                }
                return null;
              })()}
            </button>
          )}

          {track && onOpenEmbedPlayer && (
            <button
              id="fullscreen-embed-player-btn"
              type="button"
              onClick={() => onOpenEmbedPlayer(track)}
              className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium flex items-center gap-1.5 text-xs transition shadow-md shadow-red-600/30"
              title="Watch & Listen to Original Track on YouTube / Spotify"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Watch on YouTube / Spotify</span>
            </button>
          )}

          <button
            id="close-fullscreen-player-btn"
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
            title="Exit Full Screen (Esc)"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Display: Album Art, Waveform, Metadata */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center my-auto">
        <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-slate-400/20 dark:shadow-black/80 border border-slate-200 dark:border-slate-800 mb-8">
          <img
            src={track.coverArtUrl}
            alt={track.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {track.isPrivate && (
            <div className="absolute top-3 left-3 bg-white/85 dark:bg-black/75 backdrop-blur px-2.5 py-1 rounded-full text-amber-800 dark:text-amber-400 flex items-center gap-1.5 text-xs font-semibold shadow-xs">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Private to Uploader</span>
            </div>
          )}
        </div>

        <div className="w-full mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1.5">
            {track.title}
          </h1>
          <p className="text-lg text-emerald-700 dark:text-emerald-400 font-semibold mb-1">{track.artist}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {track.album} • {track.genre} • {track.releaseYear}
          </p>
        </div>

        {/* Dynamic Waveform Canvas */}
        <div className="w-full max-w-md h-20 flex items-center justify-center mb-6">
          <canvas ref={canvasRef} width={400} height={70} className="w-full h-full" />
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-4">
          <div
            className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer relative overflow-hidden group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              onSeek(ratio * track.duration);
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-400 rounded-full transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono mt-2">
            <span>{formatTime(playerState.currentTime)}</span>
            <span>{formatTime(track.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={onShuffleToggle}
            className={`p-2.5 rounded-full transition ${
              playerState.isShuffled
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onPrev}
            className="p-3 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={onPlayToggle}
            className="w-16 h-16 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center hover:bg-emerald-500 dark:hover:bg-emerald-400 hover:scale-105 active:scale-95 transition shadow-xl shadow-emerald-600/30 dark:shadow-emerald-950/60"
          >
            {playerState.isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            className="p-3 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={onRepeatToggle}
            className={`p-2.5 rounded-full transition ${
              playerState.repeatMode !== 'off'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {playerState.repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/60 pt-4 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            Zero Egress Storage (Cloudflare R2)
          </span>
          <span>Bitrate: {track.bitrateKbps} kbps</span>
          <span>Size: {(track.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={onMuteToggle} className="text-slate-500 dark:text-slate-400">
            {playerState.isMuted ? <VolumeX className="w-4 h-4 text-rose-500 dark:text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={playerState.isMuted ? 0 : playerState.volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-24 h-1 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
