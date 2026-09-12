import { ListenRoom, RoomChatMessage, RoomParticipant, UserProfile, Track } from '../types';
import { INITIAL_TRACKS } from '../data/initialTracks';

const STORAGE_KEY_ROOMS = 'your_melody_listen_rooms';
const CHANNEL_NAME = 'your_melody_rooms_channel';

// Clean starter room hosted by We Music
const INITIAL_ROOMS: ListenRoom[] = [
  {
    id: 'room_wemusic_lounge',
    name: 'We Music Community Lounge',
    passcode: '1234',
    hostId: 'usr_editorial_wemusic',
    hostName: 'We Music',
    hostUsername: 'wemusic',
    currentTrackId: INITIAL_TRACKS[0]?.id || 'trk_01',
    currentTrack: INITIAL_TRACKS[0],
    isPlaying: true,
    currentTime: 24,
    lastSyncTimestamp: Date.now(),
    participants: [],
    chatMessages: [],
    createdAt: new Date().toISOString(),
  },
];

// BroadcastChannel singleton for multi-tab/multi-window synchronization
let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel initialization failed, falling back to storage events:', e);
  }
}

export const getRooms = (): ListenRoom[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROOMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(INITIAL_ROOMS));
      return INITIAL_ROOMS;
    }
    const parsed: ListenRoom[] = JSON.parse(raw);
    // Sanitize out deprecated dummy users (Alex Rivera, Elena Rostova, Marcus Chen)
    const sanitized = parsed
      .filter(
        (r) =>
          r.hostUsername !== 'alexrivera' &&
          r.hostUsername !== 'elenarostova' &&
          r.hostUsername !== 'marcuschen' &&
          r.hostId !== 'usr_c0mmun1ty_01' &&
          r.hostId !== 'usr_c0mmun1ty_02' &&
          r.hostId !== 'usr_c0mmun1ty_03'
      )
      .map((r) => ({
        ...r,
        participants: (r.participants || []).filter(
          (p) =>
            p.username !== 'alexrivera' &&
            p.username !== 'elenarostova' &&
            p.username !== 'marcuschen'
        ),
        chatMessages: (r.chatMessages || []).filter(
          (m) =>
            m.username !== 'alexrivera' &&
            m.username !== 'elenarostova' &&
            m.username !== 'marcuschen'
        ),
      }));

    if (sanitized.length === 0) {
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(INITIAL_ROOMS));
      return INITIAL_ROOMS;
    }

    if (sanitized.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (e) {
    console.error('Failed to load rooms:', e);
    return INITIAL_ROOMS;
  }
};

export const saveRooms = (rooms: ListenRoom[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
  } catch (e) {
    console.error('Failed to save rooms:', e);
  }
};

export const getRoom = (roomId: string): ListenRoom | null => {
  const rooms = getRooms();
  return rooms.find((r) => r.id === roomId) || null;
};

export const createRoom = (
  name: string,
  passcode: string,
  host: UserProfile,
  initialTrack: Track
): ListenRoom => {
  const newRoom: ListenRoom = {
    id: `room_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
    name: name.trim() || 'Cozy Listening Room',
    passcode: passcode.trim(),
    hostId: host.id,
    hostName: host.name,
    hostUsername: host.username,
    currentTrackId: initialTrack.id,
    currentTrack: initialTrack,
    isPlaying: true,
    currentTime: 0,
    lastSyncTimestamp: Date.now(),
    participants: [
      {
        userId: host.id,
        name: host.name,
        username: host.username,
        avatarUrl: host.avatarUrl,
        isHost: true,
        joinedAt: new Date().toISOString(),
      },
    ],
    chatMessages: [
      {
        id: `msg_sys_${Date.now()}`,
        userId: host.id,
        userName: host.name,
        username: host.username,
        avatarUrl: host.avatarUrl,
        text: `Room created by @${host.username}. Passcode: ${passcode ? 'Protected' : 'Open'}`,
        timestamp: new Date().toISOString(),
        type: 'system',
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const currentRooms = getRooms();
  const updatedRooms = [newRoom, ...currentRooms];
  saveRooms(updatedRooms);

  if (channel) {
    channel.postMessage({ type: 'ROOM_CREATED', room: newRoom });
  }

  return newRoom;
};

export const joinRoomWithCredentials = (
  nameOrId: string,
  passcode: string,
  user: UserProfile
): { success: boolean; room?: ListenRoom; error?: string } => {
  const rooms = getRooms();
  const search = nameOrId.trim().toLowerCase();

  const found = rooms.find(
    (r) => r.id.toLowerCase() === search || r.name.toLowerCase() === search
  );

  if (!found) {
    return { success: false, error: 'No room found matching that name or ID' };
  }

  if (found.passcode && found.passcode !== passcode.trim()) {
    return { success: false, error: 'Incorrect room passcode' };
  }

  // Add user to participants if not already present
  const alreadyIn = found.participants.some((p) => p.userId === user.id);
  let updatedParticipants = found.participants;
  let updatedChat = found.chatMessages;

  if (!alreadyIn) {
    const newParticipant: RoomParticipant = {
      userId: user.id,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isHost: found.hostId === user.id,
      joinedAt: new Date().toISOString(),
    };
    updatedParticipants = [...found.participants, newParticipant];

    const joinMessage: RoomChatMessage = {
      id: `msg_join_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      text: `@${user.username} joined the room`,
      timestamp: new Date().toISOString(),
      type: 'system',
    };
    updatedChat = [...found.chatMessages, joinMessage];
  }

  const updatedRoom: ListenRoom = {
    ...found,
    participants: updatedParticipants,
    chatMessages: updatedChat,
  };

  const updatedRooms = rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
  saveRooms(updatedRooms);

  if (channel) {
    channel.postMessage({ type: 'ROOM_UPDATED', room: updatedRoom });
  }

  return { success: true, room: updatedRoom };
};

export const leaveRoom = (roomId: string, userId: string): void => {
  const rooms = getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return;

  const leavingParticipant = room.participants.find((p) => p.userId === userId);
  const updatedParticipants = room.participants.filter((p) => p.userId !== userId);

  let updatedChat = room.chatMessages;
  if (leavingParticipant) {
    updatedChat = [
      ...room.chatMessages,
      {
        id: `msg_leave_${Date.now()}`,
        userId: leavingParticipant.userId,
        userName: leavingParticipant.name,
        username: leavingParticipant.username,
        avatarUrl: leavingParticipant.avatarUrl,
        text: `@${leavingParticipant.username} left the room`,
        timestamp: new Date().toISOString(),
        type: 'system',
      },
    ];
  }

  const updatedRoom: ListenRoom = {
    ...room,
    participants: updatedParticipants,
    chatMessages: updatedChat,
  };

  saveRooms(rooms.map((r) => (r.id === roomId ? updatedRoom : r)));

  if (channel) {
    channel.postMessage({ type: 'ROOM_UPDATED', room: updatedRoom });
  }
};

export const syncRoomPlayback = (
  roomId: string,
  track: Track,
  isPlaying: boolean,
  currentTime: number
): void => {
  const rooms = getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return;

  const updatedRoom: ListenRoom = {
    ...room,
    currentTrackId: track.id,
    currentTrack: track,
    isPlaying,
    currentTime,
    lastSyncTimestamp: Date.now(),
  };

  saveRooms(rooms.map((r) => (r.id === roomId ? updatedRoom : r)));

  if (channel) {
    channel.postMessage({
      type: 'ROOM_PLAYBACK_SYNC',
      roomId,
      track,
      isPlaying,
      currentTime,
      timestamp: Date.now(),
    });
  }
};

export const sendRoomChatMessage = (
  roomId: string,
  user: UserProfile,
  text: string,
  type: 'chat' | 'reaction' = 'chat'
): void => {
  const rooms = getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return;

  const newMsg: RoomChatMessage = {
    id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    text,
    timestamp: new Date().toISOString(),
    type,
  };

  const updatedRoom: ListenRoom = {
    ...room,
    chatMessages: [...room.chatMessages, newMsg],
  };

  saveRooms(rooms.map((r) => (r.id === roomId ? updatedRoom : r)));

  if (channel) {
    channel.postMessage({
      type: 'ROOM_NEW_MESSAGE',
      roomId,
      message: newMsg,
    });
  }
};

// Shareable Room Generator for TrackList sharing
export const createShareableRoomForTrack = (
  track: Track,
  host: UserProfile,
  customPasscode = '1234'
): { room: ListenRoom; shareUrl: string } => {
  const rooms = getRooms();
  // Check if a room for this track already exists hosted by this user
  let room = rooms.find((r) => r.currentTrackId === track.id && r.hostId === host.id);

  if (!room) {
    const roomTitle = `${track.title} • Synced Lounge`;
    room = createRoom(roomTitle, customPasscode, host, track);
  }

  // Construct absolute URL with query params
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const shareUrl = `${origin}${pathname}?room=${encodeURIComponent(room.id)}&track=${encodeURIComponent(track.id)}&passcode=${encodeURIComponent(room.passcode || customPasscode)}`;

  return { room, shareUrl };
};

// Reconstruct/ensure room existence on URL access
export const ensureRoomExistsForShare = (
  roomId: string,
  trackId: string,
  passcode: string,
  allTracks: Track[],
  currentUser: UserProfile
): ListenRoom => {
  const existing = getRoom(roomId);
  if (existing) {
    return existing;
  }

  // Track lookup or fallback
  const track = allTracks.find((t) => t.id === trackId) || allTracks[0];

  const syntheticRoom: ListenRoom = {
    id: roomId,
    name: track ? `${track.title} • Shared Session` : 'Shared Music Lounge',
    passcode: passcode || '1234',
    hostId: currentUser.id,
    hostName: currentUser.name,
    hostUsername: currentUser.username,
    currentTrackId: track.id,
    currentTrack: track,
    isPlaying: true,
    currentTime: 0,
    lastSyncTimestamp: Date.now(),
    participants: [
      {
        userId: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl,
        isHost: true,
        joinedAt: new Date().toISOString(),
      },
    ],
    chatMessages: [
      {
        id: `msg_sys_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl,
        text: `Joined shared room via invite link for "${track.title}"`,
        timestamp: new Date().toISOString(),
        type: 'system',
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const currentRooms = getRooms();
  saveRooms([syntheticRoom, ...currentRooms]);

  if (channel) {
    channel.postMessage({ type: 'ROOM_CREATED', room: syntheticRoom });
  }

  return syntheticRoom;
};

// Subscription hook for real-time room events
export const subscribeToRoomEvents = (
  roomId: string,
  handlers: {
    onRoomUpdated: (room: ListenRoom) => void;
    onPlaybackSync?: (data: { track: Track; isPlaying: boolean; currentTime: number }) => void;
    onNewMessage?: (msg: RoomChatMessage) => void;
  }
) => {
  const onBroadcastMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data) return;

    if (data.type === 'ROOM_UPDATED' && data.room?.id === roomId) {
      handlers.onRoomUpdated(data.room);
    }
    if (data.type === 'ROOM_PLAYBACK_SYNC' && data.roomId === roomId) {
      if (handlers.onPlaybackSync) {
        handlers.onPlaybackSync({
          track: data.track,
          isPlaying: data.isPlaying,
          currentTime: data.currentTime,
        });
      }
    }
    if (data.type === 'ROOM_NEW_MESSAGE' && data.roomId === roomId) {
      if (handlers.onNewMessage) {
        handlers.onNewMessage(data.message);
      }
    }
  };

  // Also listen for storage events in case BroadcastChannel is not active
  const onStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_ROOMS) {
      const room = getRoom(roomId);
      if (room) {
        handlers.onRoomUpdated(room);
      }
    }
  };

  if (channel) {
    channel.addEventListener('message', onBroadcastMessage);
  }
  window.addEventListener('storage', onStorageChange);

  return () => {
    if (channel) {
      channel.removeEventListener('message', onBroadcastMessage);
    }
    window.removeEventListener('storage', onStorageChange);
  };
};
