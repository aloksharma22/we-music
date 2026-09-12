export type UserRole = 'ADMIN' | 'MODERATOR' | 'MEMBER';

export type PlaylistAccessRole = 'OWNER' | 'EDITOR' | 'CONTRIBUTOR' | 'VIEWER';

export type AudioFormat = 'MP3' | 'AAC' | 'FLAC' | 'WAV' | 'OGG' | 'ALAC';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  authProvider: 'google' | 'apple' | 'guest';
  isGuest?: boolean;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  createdAt: string;
  lastActiveAt: string;
}

export type SongCategory = 'all' | 'coke_studio' | 'anuv_jain' | 'english' | 'hindi' | 'punjabi' | 'hindi_retro' | 'community';

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  username: string;
  userAvatar: string;
  userRole?: UserRole;
  text: string;
  createdAt: string;
  likesCount: number;
  likedBy: string[];
}

export interface TrackComment {
  id: string;
  trackId: string;
  userId: string;
  userName: string;
  username: string;
  userAvatar: string;
  userRole?: UserRole;
  text: string;
  createdAt: string;
  trackTimestampSec?: number;
  likesCount: number;
  likedBy: string[];
  replies: CommentReply[];
  isPinned?: boolean;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  category?: 'english' | 'hindi' | 'punjabi' | 'hindi_retro' | 'community';
  duration: number; // in seconds
  releaseYear: number;
  coverArtUrl: string;
  uploaderId: string;
  uploaderName: string;
  uploaderUsername?: string;
  isPrivate: boolean; // default true
  fileSizeBytes: number;
  format: AudioFormat;
  bitrateKbps: number;
  waveform: number[]; // normalized 0-1 amplitude points
  audioPreset: 'ambient' | 'synthwave' | 'chillhop' | 'piano' | 'deepbass';
  streamUrl?: string;
  youtubeId?: string;
  previewAudioUrl?: string;
  spotifyUrl?: string;
  createdAt: string;
  playCount: number;
  isFavorite?: boolean;
  isCachedOffline?: boolean;
  commentsCount?: number;
}

export interface PlaylistCollaborator {
  userId: string;
  userName: string;
  username: string;
  userEmail: string;
  userAvatar: string;
  role: PlaylistAccessRole;
  addedAt: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverArtUrl: string;
  ownerId: string;
  ownerName: string;
  ownerUsername?: string;
  isPrivate: boolean;
  isCollaborative: boolean;
  trackCount: number;
  totalDuration: number; // seconds
  trackIds: string[];
  collaborators: PlaylistCollaborator[];
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

export type PlaybackRepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 - 1
  isMuted: boolean;
  playbackRate: number; // 0.5 to 2.0
  repeatMode: PlaybackRepeatMode;
  isShuffled: boolean;
  autoplayNext?: boolean;
  crossfadeDuration: number; // 0 to 12 seconds
  queue: Track[];
  history: Track[];
  isFullScreen: boolean;
}

export interface ArchitectureSectionItem {
  id: string;
  number: number;
  title: string;
  category: 'Strategic' | 'System' | 'Data & Security' | 'Experience' | 'DevOps & Economics';
  summary: string;
  contentMarkdown?: string;
  badge?: string;
}

// Multi-User Listen Together Room Types
export interface RoomParticipant {
  userId: string;
  name: string;
  username: string;
  avatarUrl: string;
  isHost: boolean;
  joinedAt: string;
}

export interface RoomChatMessage {
  id: string;
  userId: string;
  userName: string;
  username: string;
  avatarUrl: string;
  text: string;
  timestamp: string;
  type?: 'chat' | 'reaction' | 'system';
}

export interface ListenRoom {
  id: string;
  name: string;
  passcode: string; // Passcode required to enter
  hostId: string;
  hostName: string;
  hostUsername: string;
  currentTrackId: string;
  currentTrack?: Track;
  isPlaying: boolean;
  currentTime: number;
  lastSyncTimestamp: number;
  participants: RoomParticipant[];
  chatMessages: RoomChatMessage[];
  createdAt: string;
}

// Artist Live Stream Types
export interface LiveStreamChatMessage {
  id: string;
  userId: string;
  userName: string;
  username: string;
  avatarUrl: string;
  text: string;
  timestamp: string;
  isHost?: boolean;
}

export interface LiveStream {
  id: string;
  artistId: string;
  artistName: string;
  artistUsername: string;
  artistAvatar: string;
  title: string;
  genre: string;
  description: string;
  status: 'live' | 'ended';
  startedAt: string;
  viewerCount: number;
  currentTrackTitle?: string;
  currentTrackArtist?: string;
  viewers: { userId: string; username: string; avatarUrl: string }[];
  chatMessages: LiveStreamChatMessage[];
  likesCount: number;
}

// Artist Aesthetic Themes (Studio Emerald dark mode and Clean Light Studio light mode)
export type ThemeId =
  | 'emerald'
  | 'light_studio';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  tagline: string;
  genreMatch: string;
  mode: 'dark' | 'light';
  accentHex: string;
  secondaryHex: string;
  bgHex: string;
  surfaceHex: string;
  cardHex: string;
  borderHex: string;
  textHex: string;
  mutedHex: string;
  previewGradient: string;
}

