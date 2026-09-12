import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Users,
  Lock,
  Key,
  Play,
  Pause,
  Copy,
  Check,
  Send,
  Sparkles,
  Music,
  Radio,
  LogOut,
  RefreshCw,
  Flame,
  Heart,
  Zap,
  Share2,
} from 'lucide-react';
import { ListenRoom, Track, UserProfile, RoomChatMessage } from '../../types';
import {
  getRooms,
  joinRoomWithCredentials,
  createRoom,
  leaveRoom,
  syncRoomPlayback,
  sendRoomChatMessage,
  subscribeToRoomEvents,
} from '../../services/roomService';

interface ListenRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlayPause: () => void;
  onSeek: (seconds: number) => void;
  initialRoomId?: string | null;
  initialPasscode?: string | null;
  onActiveRoomChange?: (roomName: string | undefined) => void;
}

export const ListenRoomModal: React.FC<ListenRoomModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allTracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlayPause,
  onSeek,
  initialRoomId,
  initialPasscode,
  onActiveRoomChange,
}) => {
  const [activeTab, setActiveTab] = useState<'join' | 'create' | 'browse'>('browse');
  const [activeRoom, setActiveRoom] = useState<ListenRoom | null>(null);

  // Join form state
  const [joinNameOrId, setJoinNameOrId] = useState('');
  const [joinPasscode, setJoinPasscode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Create form state
  const [createName, setCreateName] = useState(`${currentUser.name}'s Lounge`);
  const [createPasscode, setCreatePasscode] = useState('1234');
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    currentTrack?.id || allTracks[0]?.id || ''
  );

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [copiedPasscode, setCopiedPasscode] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string }[]>([]);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load rooms for browsing
  const [roomsList, setRoomsList] = useState<ListenRoom[]>([]);

  // Automatically join room if opened with initialRoomId (e.g., from share link)
  useEffect(() => {
    if (isOpen && initialRoomId && (!activeRoom || activeRoom.id !== initialRoomId)) {
      const res = joinRoomWithCredentials(
        initialRoomId,
        initialPasscode || '1234',
        currentUser
      );
      if (res.success && res.room) {
        setActiveRoom(res.room);
        if (res.room.currentTrack) {
          onPlayTrack(res.room.currentTrack);
        }
        if (onActiveRoomChange) {
          onActiveRoomChange(res.room.name);
        }
      }
    }
  }, [isOpen, initialRoomId, initialPasscode, currentUser]);

  // Sync active room name to parent for header display
  useEffect(() => {
    if (onActiveRoomChange) {
      onActiveRoomChange(activeRoom ? activeRoom.name : undefined);
    }
  }, [activeRoom, onActiveRoomChange]);

  useEffect(() => {
    if (isOpen) {
      setRoomsList(getRooms());
    }
  }, [isOpen, activeRoom]);

  // Subscribe to active room real-time events
  useEffect(() => {
    if (!activeRoom) return;

    const unsubscribe = subscribeToRoomEvents(activeRoom.id, {
      onRoomUpdated: (updatedRoom) => {
        setActiveRoom(updatedRoom);
      },
      onPlaybackSync: (data) => {
        // Sync track if different
        if (currentTrack?.id !== data.track.id) {
          onPlayTrack(data.track);
        }
        if (data.isPlaying !== isPlaying) {
          onTogglePlayPause();
        }
        onSeek(data.currentTime);
      },
      onNewMessage: (msg) => {
        setActiveRoom((prev) =>
          prev ? { ...prev, chatMessages: [...prev.chatMessages, msg] } : null
        );
        if (msg.type === 'reaction') {
          triggerFloatingReaction(msg.text);
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [activeRoom?.id, currentTrack?.id, isPlaying, onPlayTrack, onTogglePlayPause, onSeek]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeRoom?.chatMessages]);

  const triggerFloatingReaction = (emoji: string) => {
    const id = `float_${Date.now()}_${Math.random()}`;
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (!joinNameOrId.trim()) {
      setJoinError('Please enter a room name or ID');
      return;
    }

    const res = joinRoomWithCredentials(joinNameOrId, joinPasscode, currentUser);
    if (res.success && res.room) {
      setActiveRoom(res.room);
      if (res.room.currentTrack) {
        onPlayTrack(res.room.currentTrack);
      }
      setJoinNameOrId('');
      setJoinPasscode('');
    } else {
      setJoinError(res.error || 'Failed to join room');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    const track = allTracks.find((t) => t.id === selectedTrackId) || allTracks[0];
    const newRoom = createRoom(createName, createPasscode, currentUser, track);
    setActiveRoom(newRoom);
    onPlayTrack(track);
  };

  const handleLeave = () => {
    if (activeRoom) {
      leaveRoom(activeRoom.id, currentUser.id);
      setActiveRoom(null);
    }
  };

  const handleCopyPasscode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.passcode);
    setCopiedPasscode(true);
    setTimeout(() => setCopiedPasscode(false), 2000);
  };

  const handleCopyShareUrl = () => {
    if (!activeRoom) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const trackId = activeRoom.currentTrackId || (currentTrack ? currentTrack.id : '');
    const url = `${origin}${pathname}?room=${encodeURIComponent(activeRoom.id)}&track=${encodeURIComponent(trackId)}&passcode=${encodeURIComponent(activeRoom.passcode || '1234')}`;
    navigator.clipboard.writeText(url);
    setCopiedShareUrl(true);
    setTimeout(() => setCopiedShareUrl(false), 2500);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeRoom) return;
    sendRoomChatMessage(activeRoom.id, currentUser, chatInput.trim(), 'chat');
    setChatInput('');
  };

  const handleSendReaction = (emoji: string) => {
    if (!activeRoom) return;
    sendRoomChatMessage(activeRoom.id, currentUser, emoji, 'reaction');
    triggerFloatingReaction(emoji);
  };

  const handleHostTogglePlay = () => {
    if (!activeRoom || !currentTrack) return;
    const nextPlaying = !isPlaying;
    onTogglePlayPause();
    syncRoomPlayback(activeRoom.id, currentTrack, nextPlaying, activeRoom.currentTime);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Floating Reaction Layer */}
      <div className="pointer-events-none fixed inset-0 z-60 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-24 right-1/4 text-4xl animate-bounce"
            style={{
              animation: 'floatUp 2s ease-out forwards',
              left: `${30 + Math.random() * 40}%`,
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      <div
        className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-md">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {activeRoom ? activeRoom.name : 'Listen Together Rooms'}
                </h2>
                {activeRoom && (
                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 animate-pulse">
                    ● SYNC ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {activeRoom
                  ? `Hosted by @${activeRoom.hostUsername} • Passcode Protected Synchronized Audio`
                  : 'Join with Room Name & Passcode or host your own session for synced streaming'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeRoom && (
              <button
                type="button"
                onClick={handleLeave}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Room</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {!activeRoom ? (
          /* Lobby View */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`pb-3 px-4 text-xs font-semibold tracking-wide transition border-b-2 cursor-pointer ${
                  activeTab === 'browse'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Browse Active Rooms ({roomsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('join')}
                className={`pb-3 px-4 text-xs font-semibold tracking-wide transition border-b-2 cursor-pointer ${
                  activeTab === 'join'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Join with Name & Passcode
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`pb-3 px-4 text-xs font-semibold tracking-wide transition border-b-2 cursor-pointer ${
                  activeTab === 'create'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Host New Room
              </button>
            </div>

            {/* Tab: Browse */}
            {activeTab === 'browse' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roomsList.map((room) => (
                    <div
                      key={room.id}
                      className="bg-slate-950/50 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-sm text-white group-hover:text-emerald-300 transition">
                              {room.name}
                            </h3>
                            <span className="text-xs text-slate-400">
                              Host: @{room.hostUsername}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            <Users className="w-3 h-3 text-emerald-400" />
                            {room.participants.length}
                          </span>
                        </div>

                        {room.currentTrack && (
                          <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800 mb-3">
                            <img
                              src={room.currentTrack.coverArtUrl}
                              alt=""
                              className="w-8 h-8 rounded object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-white truncate">
                                {room.currentTrack.title}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {room.currentTrack.artist}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          <Lock className="w-3 h-3 text-amber-400" />
                          Passcode Required
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setJoinNameOrId(room.name);
                            setJoinPasscode(room.passcode);
                            setActiveTab('join');
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-xs font-semibold transition cursor-pointer"
                        >
                          Join Room
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Join */}
            {activeTab === 'join' && (
              <form onSubmit={handleJoin} className="max-w-md mx-auto space-y-4 py-4">
                <div className="text-center space-y-1 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-2">
                    <Key className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Enter Room Credentials</h3>
                  <p className="text-xs text-slate-400">
                    Provide the room name and passcode to sync into the live playback session.
                  </p>
                </div>

                {joinError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300">
                    {joinError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Room Name or Room ID
                  </label>
                  <input
                    type="text"
                    value={joinNameOrId}
                    onChange={(e) => setJoinNameOrId(e.target.value)}
                    placeholder="e.g. Deep Focus Studio"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Room Passcode</span>
                    <span className="text-[11px] text-slate-500">Case-sensitive</span>
                  </label>
                  <input
                    type="password"
                    value={joinPasscode}
                    onChange={(e) => setJoinPasscode(e.target.value)}
                    placeholder="Enter passcode (e.g. 1234)"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md"
                >
                  Join & Sync Audio
                </button>
              </form>
            )}

            {/* Tab: Create */}
            {activeTab === 'create' && (
              <form onSubmit={handleCreate} className="max-w-md mx-auto space-y-4 py-4">
                <div className="text-center space-y-1 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-2">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Create a Private Listening Room</h3>
                  <p className="text-xs text-slate-400">
                    You control track playback, seek positions, and curate for connected listeners.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Set Room Passcode
                  </label>
                  <input
                    type="text"
                    value={createPasscode}
                    onChange={(e) => setCreatePasscode(e.target.value)}
                    placeholder="e.g. 1234 or melody"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Select Initial Track
                  </label>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {allTracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} — {t.artist}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md"
                >
                  Create & Launch Room
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Active Room Stage */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Player & Participants */}
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto space-y-6">
              {/* Room Controls Bar */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-300">
                    Passcode: <strong className="font-mono text-white">{activeRoom.passcode}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyShareUrl}
                    className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition cursor-pointer"
                    title="Copy shareable link with ?room and ?track parameters"
                  >
                    {copiedShareUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" /> Link Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" /> Share Room URL
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPasscode}
                    className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    {copiedPasscode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Passcode
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Synchronized Track Card */}
              {currentTrack && (
                <div className="flex flex-col sm:flex-row items-center gap-5 bg-linear-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="relative group shrink-0">
                    <img
                      src={currentTrack.coverArtUrl}
                      alt=""
                      className={`w-24 h-24 rounded-2xl object-cover shadow-xl ${
                        isPlaying ? 'ring-2 ring-emerald-500 animate-pulse' : ''
                      }`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleHostTogglePlay}
                        className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 transition cursor-pointer"
                        title={
                          activeRoom.hostId === currentUser.id
                            ? 'Toggle playback for all listeners'
                            : 'Host controls playback'
                        }
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-center sm:text-left min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold">
                      Now Syncing In Room
                    </span>
                    <h3 className="text-base font-bold text-white truncate mt-0.5">
                      {currentTrack.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Uploaded by @{currentTrack.uploaderUsername || 'curator'}
                    </p>
                  </div>
                </div>
              )}

              {/* Host vs Listener Status */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-300">
                    {activeRoom.hostId === currentUser.id ? (
                      <>You are the <strong>Host</strong>. Your playback controls sync to all listeners in this room.</>
                    ) : (
                      <>Listening in sync with <strong>@{activeRoom.hostUsername}</strong>.</>
                    )}
                  </span>
                </div>
                {activeRoom.hostId !== currentUser.id && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeRoom.currentTrack) onPlayTrack(activeRoom.currentTrack);
                      onSeek(activeRoom.currentTime);
                    }}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline cursor-pointer ml-2 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" /> Resync
                  </button>
                )}
              </div>

              {/* Active Participants */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-3">
                  Listeners in Room ({activeRoom.participants.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeRoom.participants.map((p) => (
                    <div
                      key={p.userId}
                      className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5"
                    >
                      <img
                        src={p.avatarUrl}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-slate-700"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white truncate">
                            {p.name}
                          </span>
                          {p.isHost && (
                            <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300 font-bold">
                              HOST
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono block truncate">
                          @{p.username}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Room Chat & Flying Reactions */}
            <div className="w-full md:w-80 flex flex-col bg-slate-950/50">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  Live Room Chat
                </span>
                <span className="text-[10px] font-mono text-slate-400">Real-time</span>
              </div>

              {/* Chat Feed */}
              <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[220px]">
                {activeRoom.chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`text-xs ${
                      msg.type === 'system'
                        ? 'text-center text-[11px] text-slate-500 italic py-1'
                        : 'space-y-0.5'
                    }`}
                  >
                    {msg.type !== 'system' && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-emerald-400">@{msg.username}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                    <p
                      className={`${
                        msg.type === 'reaction'
                          ? 'text-2xl py-1'
                          : 'text-slate-200 break-words'
                      }`}
                    >
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick Reactions Bar */}
              <div className="px-3 py-2 border-t border-slate-800/80 flex items-center justify-around bg-slate-950/80">
                {['🔥', '💖', '🎧', '⚡', '🎶', '👏'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendReaction(emoji)}
                    className="hover:scale-125 transition text-lg cursor-pointer p-1"
                    title={`Send ${emoji} reaction`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Chat with room listeners..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition cursor-pointer"
                  title="Send message"
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
