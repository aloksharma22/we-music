import { Track, Playlist, UserProfile } from '../types';
import mediaDirectoryJson from './mediaDirectory.json';
import { REQUIRED_PUBLIC_PLAYLISTS } from './cokeStudioAndAnuvJain';

const mediaDirectory = mediaDirectoryJson as Record<
  string,
  { youtubeId?: string; previewAudioUrl?: string; spotifyQuery?: string }
>;

export const INITIAL_USER: UserProfile = {
  id: 'usr_guest_listener',
  name: 'Guest Listener',
  username: 'listener',
  email: 'listener@wemusic.internal',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  role: 'MEMBER',
  authProvider: 'guest',
  isGuest: true,
  storageUsedBytes: 0,
  storageQuotaBytes: 1024 * 1024 * 1024,
  createdAt: '2026-01-01T00:00:00Z',
  lastActiveAt: '2026-09-12T00:00:00Z',
};

// No dummy community profiles - only genuine users who register or login
export const COMMUNITY_PROFILES: UserProfile[] = [];

const BASE_INITIAL_TRACKS: Track[] = [
  {
    id: 'trk_01',
    title: 'Echoes of Andromeda',
    artist: 'Celestial Drift',
    album: 'Cosmic Horizons',
    genre: 'Electronic / Ambient',
    duration: 218,
    releaseYear: 2025,
    coverArtUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    uploaderId: 'usr_wemusic',
    uploaderName: 'We Music',
    isPrivate: false,
    fileSizeBytes: 8.7 * 1024 * 1024,
    format: 'FLAC',
    bitrateKbps: 320,
    waveform: [0.15, 0.28, 0.42, 0.65, 0.88, 0.95, 0.74, 0.62, 0.81, 0.92, 0.78, 0.55, 0.45, 0.68, 0.85, 0.72, 0.4, 0.3, 0.55, 0.75, 0.65, 0.42, 0.25, 0.15],
    audioPreset: 'ambient',
    streamUrl: '/mock/audio/track1.flac',
    createdAt: '2025-02-10T14:30:00Z',
    playCount: 142,
    isFavorite: false,
    isCachedOffline: false,
  },
  {
    id: 'trk_02',
    title: 'Midnight Reverie',
    artist: 'Kira Vance',
    album: 'Neon Solitude',
    genre: 'Synthwave',
    duration: 184,
    releaseYear: 2025,
    coverArtUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    uploaderId: 'usr_wemusic',
    uploaderName: 'We Music',
    isPrivate: false,
    fileSizeBytes: 7.2 * 1024 * 1024,
    format: 'AAC',
    bitrateKbps: 256,
    waveform: [0.25, 0.35, 0.55, 0.72, 0.85, 0.9, 0.88, 0.75, 0.65, 0.78, 0.89, 0.94, 0.7, 0.62, 0.8, 0.85, 0.6, 0.45, 0.5, 0.65, 0.4, 0.3, 0.2, 0.1],
    audioPreset: 'synthwave',
    streamUrl: '/mock/audio/track2.aac',
    createdAt: '2025-03-01T10:15:00Z',
    playCount: 89,
    isFavorite: false,
    isCachedOffline: false,
  },
  {
    id: 'trk_03',
    title: 'Coffee Beans & Raindrops',
    artist: 'The Lowkey Ensemble',
    album: 'Sunday Sessions Vol. 2',
    genre: 'Lo-Fi Chillhop',
    duration: 165,
    releaseYear: 2024,
    coverArtUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&auto=format&fit=crop&q=80',
    uploaderId: 'usr_wemusic',
    uploaderName: 'We Music',
    isPrivate: false,
    fileSizeBytes: 6.4 * 1024 * 1024,
    format: 'MP3',
    bitrateKbps: 320,
    waveform: [0.1, 0.2, 0.35, 0.5, 0.62, 0.7, 0.68, 0.72, 0.65, 0.58, 0.64, 0.68, 0.72, 0.6, 0.55, 0.65, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.15, 0.1],
    audioPreset: 'chillhop',
    streamUrl: '/mock/audio/track3.mp3',
    createdAt: '2025-03-12T18:40:00Z',
    playCount: 215,
    isFavorite: false,
    isCachedOffline: false,
  },
  {
    id: 'trk_05',
    title: 'Nocturne in D Minor (Solo)',
    artist: 'Julian Hayes',
    album: 'Solitary Keys',
    genre: 'Modern Classical',
    duration: 208,
    releaseYear: 2024,
    coverArtUrl: 'https://images.unsplash.com/photo-1520523839898-50712825e3a7?w=400&auto=format&fit=crop&q=80',
    uploaderId: 'usr_wemusic',
    uploaderName: 'We Music',
    isPrivate: false,
    fileSizeBytes: 8.1 * 1024 * 1024,
    format: 'WAV',
    bitrateKbps: 320,
    waveform: [0.08, 0.15, 0.25, 0.4, 0.6, 0.75, 0.82, 0.65, 0.5, 0.7, 0.85, 0.9, 0.65, 0.45, 0.7, 0.8, 0.55, 0.4, 0.35, 0.5, 0.4, 0.25, 0.15, 0.08],
    audioPreset: 'piano',
    streamUrl: '/mock/audio/track5.wav',
    createdAt: '2025-04-20T21:00:00Z',
    playCount: 68,
    isFavorite: false,
    isCachedOffline: false,
  },
];

export const INITIAL_TRACKS: Track[] = BASE_INITIAL_TRACKS.map((t) => ({
  ...t,
  youtubeId: mediaDirectory[t.id]?.youtubeId,
  previewAudioUrl: mediaDirectory[t.id]?.previewAudioUrl,
  spotifyUrl: mediaDirectory[t.id]?.spotifyQuery,
  streamUrl: mediaDirectory[t.id]?.previewAudioUrl || t.streamUrl,
}));

// Clean public curated playlists only - dummy user playlists pl_01, pl_02, pl_03, pl_04 completely deleted
export const INITIAL_PLAYLISTS: Playlist[] = [...REQUIRED_PUBLIC_PLAYLISTS];
