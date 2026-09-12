import { LiveStream, LiveStreamChatMessage, UserProfile } from '../types';

const STORAGE_KEY_LIVE = 'your_melody_live_streams';
const CHANNEL_NAME = 'your_melody_live_channel';

const INITIAL_LIVE_STREAMS: LiveStream[] = [
  {
    id: 'live_stream_01',
    artistId: 'usr_c0mmun1ty_04',
    artistName: 'Luna Eclipse',
    artistUsername: 'lunaeclipse',
    artistAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    title: 'Sunset Modular Synthesizer & Spatial Ambient Live Set 🌌',
    genre: 'Modular Ambient / Space Drone',
    description: 'Live analog improvisation using Eurorack and tape delay loopers. Grab your headphones!',
    status: 'live',
    startedAt: new Date(Date.now() - 1440000).toISOString(),
    viewerCount: 24,
    currentTrackTitle: 'Starlight Modular Echoes (Live Improv)',
    currentTrackArtist: 'Luna Eclipse',
    viewers: [
      {
        userId: 'usr_viewer_01',
        username: 'cyber_echo',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      },
      {
        userId: 'usr_viewer_02',
        username: 'solarbeats',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
      {
        userId: 'usr_viewer_03',
        username: 'synthvoyager',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      },
    ],
    chatMessages: [
      {
        id: 'live_msg_01',
        userId: 'usr_c0mmun1ty_04',
        userName: 'Luna Eclipse',
        username: 'lunaeclipse',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        text: 'Welcome everyone to the stream! Playing custom patch bay loops today 🎧✨',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        isHost: true,
      },
      {
        id: 'live_msg_02',
        userId: 'usr_viewer_01',
        userName: 'Cyber Echo',
        username: 'cyber_echo',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        text: 'The sub-bass harmonics on this filter sweep are incredible 🔥',
        timestamp: new Date(Date.now() - 600000).toISOString(),
      },
      {
        id: 'live_msg_03',
        userId: 'usr_viewer_02',
        userName: 'Solar Beats',
        username: 'solarbeats',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        text: 'Listening on studio monitors in Berlin! 🇩🇪 Greetings Luna!',
        timestamp: new Date(Date.now() - 240000).toISOString(),
      },
    ],
    likesCount: 142,
  },
];

let liveChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    liveChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel failed for live streams:', e);
  }
}

export const getLiveStreams = (): LiveStream[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIVE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LIVE, JSON.stringify(INITIAL_LIVE_STREAMS));
      return INITIAL_LIVE_STREAMS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load live streams:', e);
    return INITIAL_LIVE_STREAMS;
  }
};

export const saveLiveStreams = (streams: LiveStream[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_LIVE, JSON.stringify(streams));
  } catch (e) {
    console.error('Failed to save live streams:', e);
  }
};

export const getActiveLiveStreams = (): LiveStream[] => {
  return getLiveStreams().filter((s) => s.status === 'live');
};

export const getLiveStream = (streamId: string): LiveStream | null => {
  const list = getLiveStreams();
  return list.find((s) => s.id === streamId) || null;
};

export const startLiveStream = (
  artist: UserProfile,
  title: string,
  genre: string,
  description: string,
  currentTrackTitle?: string,
  currentTrackArtist?: string
): LiveStream => {
  const newStream: LiveStream = {
    id: `stream_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    artistId: artist.id,
    artistName: artist.name,
    artistUsername: artist.username,
    artistAvatar: artist.avatarUrl,
    title: title.trim() || 'Live Session',
    genre: genre.trim() || 'Live Studio',
    description: description.trim() || 'Broadcast live from artist studio.',
    status: 'live',
    startedAt: new Date().toISOString(),
    viewerCount: 1,
    currentTrackTitle: currentTrackTitle || 'Live Studio Performance',
    currentTrackArtist: artist.name,
    viewers: [
      {
        userId: artist.id,
        username: artist.username,
        avatarUrl: artist.avatarUrl,
      },
    ],
    chatMessages: [
      {
        id: `msg_sys_${Date.now()}`,
        userId: artist.id,
        userName: artist.name,
        username: artist.username,
        avatarUrl: artist.avatarUrl,
        text: `Stream started by @${artist.username}. Welcome viewers! 🎙️✨`,
        timestamp: new Date().toISOString(),
        isHost: true,
      },
    ],
    likesCount: 0,
  };

  const current = getLiveStreams();
  // Filter out any previous active stream from this artist to avoid duplicates
  const updated = [newStream, ...current.filter((s) => !(s.artistId === artist.id && s.status === 'live'))];
  saveLiveStreams(updated);

  if (liveChannel) {
    liveChannel.postMessage({ type: 'LIVE_STREAM_STARTED', stream: newStream });
  }

  return newStream;
};

export const endLiveStream = (streamId: string): void => {
  const list = getLiveStreams();
  const target = list.find((s) => s.id === streamId);
  if (!target) return;

  const endedStream: LiveStream = {
    ...target,
    status: 'ended',
  };

  const updated = list.map((s) => (s.id === streamId ? endedStream : s));
  saveLiveStreams(updated);

  if (liveChannel) {
    liveChannel.postMessage({ type: 'LIVE_STREAM_ENDED', streamId });
  }
};

export const joinLiveStream = (streamId: string, user: UserProfile): LiveStream | null => {
  const list = getLiveStreams();
  const stream = list.find((s) => s.id === streamId);
  if (!stream || stream.status !== 'live') return null;

  const alreadyViewing = stream.viewers.some((v) => v.userId === user.id);
  const updatedViewers = alreadyViewing
    ? stream.viewers
    : [...stream.viewers, { userId: user.id, username: user.username, avatarUrl: user.avatarUrl }];

  const joinChatMessage: LiveStreamChatMessage = {
    id: `msg_join_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    text: `@${user.username} joined the live broadcast`,
    timestamp: new Date().toISOString(),
  };

  const updatedStream: LiveStream = {
    ...stream,
    viewers: updatedViewers,
    viewerCount: updatedViewers.length,
    chatMessages: [...stream.chatMessages, joinChatMessage],
  };

  saveLiveStreams(list.map((s) => (s.id === streamId ? updatedStream : s)));

  if (liveChannel) {
    liveChannel.postMessage({ type: 'LIVE_STREAM_UPDATED', stream: updatedStream });
  }

  return updatedStream;
};

export const leaveLiveStream = (streamId: string, userId: string): void => {
  const list = getLiveStreams();
  const stream = list.find((s) => s.id === streamId);
  if (!stream) return;

  const updatedViewers = stream.viewers.filter((v) => v.userId !== userId);
  const updatedStream: LiveStream = {
    ...stream,
    viewers: updatedViewers,
    viewerCount: Math.max(1, updatedViewers.length),
  };

  saveLiveStreams(list.map((s) => (s.id === streamId ? updatedStream : s)));

  if (liveChannel) {
    liveChannel.postMessage({ type: 'LIVE_STREAM_UPDATED', stream: updatedStream });
  }
};

export const sendLiveChatMessage = (streamId: string, user: UserProfile, text: string): void => {
  const list = getLiveStreams();
  const stream = list.find((s) => s.id === streamId);
  if (!stream) return;

  const newMsg: LiveStreamChatMessage = {
    id: `live_msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    text,
    timestamp: new Date().toISOString(),
    isHost: stream.artistId === user.id,
  };

  const updatedStream: LiveStream = {
    ...stream,
    chatMessages: [...stream.chatMessages, newMsg],
  };

  saveLiveStreams(list.map((s) => (s.id === streamId ? updatedStream : s)));

  if (liveChannel) {
    liveChannel.postMessage({ type: 'LIVE_STREAM_NEW_MESSAGE', streamId, message: newMsg });
  }
};

export const sendLiveReaction = (streamId: string, count: number = 1): void => {
  const list = getLiveStreams();
  const stream = list.find((s) => s.id === streamId);
  if (!stream) return;

  const updatedStream: LiveStream = {
    ...stream,
    likesCount: stream.likesCount + count,
  };

  saveLiveStreams(list.map((s) => (s.id === streamId ? updatedStream : s)));

  if (liveChannel) {
    liveChannel.postMessage({
      type: 'LIVE_STREAM_REACTION',
      streamId,
      newLikesCount: updatedStream.likesCount,
    });
  }
};

export const subscribeToLiveEvents = (
  streamId: string,
  handlers: {
    onStreamUpdated: (stream: LiveStream) => void;
    onStreamEnded?: () => void;
    onNewMessage?: (msg: LiveStreamChatMessage) => void;
    onReaction?: (newLikes: number) => void;
  }
) => {
  const onBroadcast = (event: MessageEvent) => {
    const data = event.data;
    if (!data) return;

    if (data.type === 'LIVE_STREAM_UPDATED' && data.stream?.id === streamId) {
      handlers.onStreamUpdated(data.stream);
    }
    if (data.type === 'LIVE_STREAM_ENDED' && data.streamId === streamId) {
      if (handlers.onStreamEnded) handlers.onStreamEnded();
    }
    if (data.type === 'LIVE_STREAM_NEW_MESSAGE' && data.streamId === streamId) {
      if (handlers.onNewMessage) handlers.onNewMessage(data.message);
    }
    if (data.type === 'LIVE_STREAM_REACTION' && data.streamId === streamId) {
      if (handlers.onReaction) handlers.onReaction(data.newLikesCount);
    }
  };

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_LIVE) {
      const s = getLiveStream(streamId);
      if (s) handlers.onStreamUpdated(s);
    }
  };

  if (liveChannel) {
    liveChannel.addEventListener('message', onBroadcast);
  }
  window.addEventListener('storage', onStorage);

  return () => {
    if (liveChannel) {
      liveChannel.removeEventListener('message', onBroadcast);
    }
    window.removeEventListener('storage', onStorage);
  };
};
