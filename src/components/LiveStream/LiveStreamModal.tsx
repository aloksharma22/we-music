import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Users,
  Heart,
  Flame,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  Share2,
  Disc,
  Play,
  Pause,
  Music,
  Check,
} from 'lucide-react';
import { LiveStream, Track, UserProfile } from '../../types';
import {
  startLiveStream,
  endLiveStream,
  joinLiveStream,
  leaveLiveStream,
  sendLiveChatMessage,
  sendLiveReaction,
  subscribeToLiveEvents,
} from '../../services/liveStreamService';

interface LiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlayPause: () => void;
  targetStreamId?: string | null;
}

export const LiveStreamModal: React.FC<LiveStreamModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allTracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlayPause,
  targetStreamId,
}) => {
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);

  // Setup form state (for artist going live)
  const [streamTitle, setStreamTitle] = useState(`${currentUser.name} — Live Improvisation`);
  const [streamGenre, setStreamGenre] = useState('Electronic / Modular Live');
  const [streamDescription, setStreamDescription] = useState('Live acoustic & modular set from the studio. Feel free to request tracks in chat!');
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    currentTrack?.id || allTracks[0]?.id || ''
  );

  // Broadcaster controls
  const [isMicActive, setIsMicActive] = useState(true);

  // Chat & reactions state
  const [chatInput, setChatInput] = useState('');
  const [floatingLikes, setFloatingLikes] = useState<{ id: string; emoji: string }[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Visualizer canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Join existing stream or open setup
  useEffect(() => {
    if (!isOpen) return;

    if (targetStreamId) {
      const joined = joinLiveStream(targetStreamId, currentUser);
      if (joined) {
        setActiveStream(joined);
      }
    }
  }, [isOpen, targetStreamId, currentUser]);

  // Subscribe to stream real-time events
  useEffect(() => {
    if (!activeStream) return;

    const unsubscribe = subscribeToLiveEvents(activeStream.id, {
      onStreamUpdated: (updated) => {
        setActiveStream(updated);
      },
      onStreamEnded: () => {
        alert('The artist has concluded this live broadcast.');
        setActiveStream(null);
      },
      onNewMessage: (msg) => {
        setActiveStream((prev) =>
          prev ? { ...prev, chatMessages: [...prev.chatMessages, msg] } : null
        );
      },
      onReaction: (newLikes) => {
        setActiveStream((prev) => (prev ? { ...prev, likesCount: newLikes } : null));
        triggerFloatingReaction('💖');
      },
    });

    return () => {
      unsubscribe();
    };
  }, [activeStream?.id]);

  // Canvas visualizer animation loop
  useEffect(() => {
    if (!activeStream || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bars = 48;
      const barWidth = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        // Synthesize dynamic audio visual frequency movement
        const freq1 = Math.sin(tick * 0.08 + i * 0.3) * 0.5 + 0.5;
        const freq2 = Math.cos(tick * 0.05 + i * 0.2) * 0.5 + 0.5;
        const noise = Math.sin(tick * 0.15 + i * 1.5) * 0.2;
        const heightMultiplier = Math.max(0.15, Math.min(1.0, freq1 * 0.6 + freq2 * 0.3 + noise));
        const barHeight = heightMultiplier * (canvas.height * 0.85);

        const x = i * barWidth;
        const y = canvas.height - barHeight;

        // Gradient styling
        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(0.5, '#06b6d4');
        grad.addColorStop(1, '#6366f1');

        ctx.fillStyle = grad;
        ctx.fillRect(x + 1.5, y, barWidth - 3, barHeight);

        // Peak dot
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x + 1.5, y - 3, barWidth - 3, 2);
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [activeStream]);

  // Auto scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeStream?.chatMessages]);

  const triggerFloatingReaction = (emoji: string) => {
    const id = `like_${Date.now()}_${Math.random()}`;
    setFloatingLikes((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingLikes((prev) => prev.filter((l) => l.id !== id));
    }, 2000);
  };

  const handleStartBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const track = allTracks.find((t) => t.id === selectedTrackId);
    const stream = startLiveStream(
      currentUser,
      streamTitle,
      streamGenre,
      streamDescription,
      track?.title || 'Modular Improv Session',
      track?.artist || currentUser.name
    );
    setActiveStream(stream);
    if (track) {
      onPlayTrack(track);
    }
  };

  const handleEndBroadcast = () => {
    if (!activeStream) return;
    if (confirm('End this live stream broadcast for all viewers?')) {
      endLiveStream(activeStream.id);
      setActiveStream(null);
    }
  };

  const handleLeaveBroadcast = () => {
    if (activeStream) {
      leaveLiveStream(activeStream.id, currentUser.id);
      setActiveStream(null);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeStream) return;
    sendLiveChatMessage(activeStream.id, currentUser, chatInput.trim());
    setChatInput('');
  };

  const handleReact = (emoji: string) => {
    if (!activeStream) return;
    sendLiveReaction(activeStream.id, 1);
    triggerFloatingReaction(emoji);
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Floating Reactions overlay */}
      <div className="pointer-events-none fixed inset-0 z-60 overflow-hidden">
        {floatingLikes.map((l) => (
          <div
            key={l.id}
            className="absolute bottom-24 text-3xl animate-bounce"
            style={{
              left: `${50 + Math.random() * 30}%`,
              animation: 'floatUp 2s ease-out forwards',
            }}
          >
            {l.emoji}
          </div>
        ))}
      </div>

      <div
        className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {activeStream ? activeStream.title : 'Artist Live Studio'}
                </h2>
                {activeStream && (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/40">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    ON AIR
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {activeStream
                  ? `Broadcasting live by @${activeStream.artistUsername} • Real-time interactive stream`
                  : 'Broadcast audio & modular synthesizers live to the global community'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeStream && activeStream.artistId === currentUser.id ? (
              <button
                type="button"
                onClick={handleEndBroadcast}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                End Stream
              </button>
            ) : activeStream ? (
              <button
                type="button"
                onClick={handleLeaveBroadcast}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Leave Stream
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!activeStream ? (
          /* Broadcaster Setup Screen */
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 max-w-xl mx-auto w-full">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-rose-500/20 to-red-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 mb-2">
                <Radio className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Go Live from Your Studio</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Connect directly with your listeners. Stream master stems or live improvisations with real-time frequency spectrums and live viewer chat.
              </p>
            </div>

            <form onSubmit={handleStartBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Broadcast Title
                </label>
                <input
                  type="text"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="e.g. Late Night Synth Jam & Stems"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Musical Genre
                  </label>
                  <input
                    type="text"
                    value={streamGenre}
                    onChange={(e) => setStreamGenre(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Initial Audio Track
                  </label>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {allTracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Broadcast Description
                </label>
                <textarea
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-linear-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                Start Live Broadcast
              </button>
            </form>
          </div>
        ) : (
          /* Live Stream Stage (Broadcaster + Audience View) */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Main Stage & Spectrum Visualizer */}
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto space-y-6 flex flex-col justify-between">
              <div>
                {/* Live Streamer Banner */}
                <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeStream.artistAvatar}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border-2 border-red-500/80 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{activeStream.artistName}</span>
                        <span className="text-xs text-red-400 font-mono">@{activeStream.artistUsername}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{activeStream.genre}</p>
                    </div>
                  </div>

                  {/* Viewer Ticker */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                      <Users className="w-3.5 h-3.5 text-red-400" />
                      <span>{activeStream.viewerCount} Viewers</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyShare}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                      title="Share live stream link"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Animated Spectrum Stage */}
                <div className="relative bg-black rounded-2xl border border-slate-800/80 p-4 overflow-hidden flex flex-col items-center justify-center min-h-[200px] shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={160}
                    className="w-full h-36 rounded-lg"
                  />

                  {/* Overlay Info */}
                  <div className="absolute top-3 left-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[11px] font-mono text-slate-300 font-semibold uppercase tracking-wider">
                      Live Audio Frequency Spectrum
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-4 flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Disc className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span>{activeStream.currentTrackTitle || 'Live Studio Signal'}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed mt-4 bg-slate-950/30 p-3 rounded-xl border border-slate-800">
                  {activeStream.description}
                </p>
              </div>

              {/* Broadcast Stage Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  {activeStream.artistId === currentUser.id && (
                    <button
                      type="button"
                      onClick={() => setIsMicActive(!isMicActive)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        isMicActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      <span>{isMicActive ? 'Mic Active' : 'Mic Muted'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onTogglePlayPause}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>

                {/* Audience Reaction Emojis */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-mono mr-1">
                    {activeStream.likesCount} Claps & Hearts
                  </span>
                  {['💖', '🔥', '👏', '⚡', '🌌'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReact(emoji)}
                      className="p-1.5 hover:scale-125 transition text-lg cursor-pointer"
                      title={`Send ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Real-time Live Stream Chat */}
            <div className="w-full md:w-80 flex flex-col bg-slate-950/60">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-red-400" />
                  Live Broadcast Chat
                </span>
                <span className="text-[10px] font-mono text-slate-500">Live audience</span>
              </div>

              {/* Chat Feed */}
              <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[240px]">
                {activeStream.chatMessages.map((msg) => (
                  <div key={msg.id} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-300">@{msg.username}</span>
                      {msg.isHost && (
                        <span className="text-[9px] font-mono px-1 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                          ARTIST
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 ml-auto">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-200 break-words leading-relaxed pl-1">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send a comment to the artist..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
