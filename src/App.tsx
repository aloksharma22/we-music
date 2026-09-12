import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Music,
  Heart,
  User,
  Library,
  Radio,
  Plus,
  Compass,
  FolderLock,
  Layers,
  Sparkles,
  WifiOff,
  Flame,
  Clock,
  Pin,
  Users,
  Palette,
  DownloadCloud,
  MessageSquare,
  Globe,
  RefreshCw,
  Share2,
  Check,
  X,
  Lock,
  Shield,
  Tv,
  Search,
  Trash2,
} from 'lucide-react';
import { Track, Playlist, PlayerState, UserRole, PlaylistAccessRole, UserProfile, ThemeId, SongCategory } from './types';
import { INITIAL_USER, INITIAL_TRACKS, INITIAL_PLAYLISTS } from './data/initialTracks';
import { CURATED_CATALOG } from './data/curatedMusicCatalog';
import { COKE_STUDIO_TRACKS, ANUV_JAIN_TRACKS, REQUESTED_SPECIAL_TRACKS, REQUIRED_PUBLIC_PLAYLISTS } from './data/cokeStudioAndAnuvJain';
import { audioEngine } from './services/audioEngine';
import { createGuestUser, loadStoredUser, saveStoredUser } from './services/authService';
import { loadStoredTheme, applyThemeToDOM, getTheme, saveStoredTheme, THEME_PALETTES } from './services/themeService';
import { createShareableRoomForTrack, ensureRoomExistsForShare } from './services/roomService';
import { commentService } from './services/commentService';
import { Header } from './components/Common/Header';
import { AuthModal } from './components/Common/AuthModal';
import { LoginPage } from './components/Auth/LoginPage';
import { getSupabaseClient, mapSupabaseUserToProfile, isSupabaseConfigured } from './services/supabaseClient';
import {
  syncUserProfileToSupabase,
  fetchUserPlaylistsFromSupabase,
  upsertPlaylistToSupabase,
  deletePlaylistFromSupabase,
  fetchUserFavoritesFromSupabase,
  toggleFavoriteInSupabase,
} from './services/supabaseDataService';
import { ThemeSelectorModal } from './components/Common/ThemeSelectorModal';
import { ListenRoomModal } from './components/Rooms/ListenRoomModal';
import { LiveStreamModal } from './components/LiveStream/LiveStreamModal';
import { BottomPlayer } from './components/AudioPlayer/BottomPlayer';
import { FullScreenPlayer } from './components/AudioPlayer/FullScreenPlayer';
import { QueueDrawer } from './components/AudioPlayer/QueueDrawer';
import { TrackList } from './components/Library/TrackList';
import { UploadModal } from './components/Library/UploadModal';
import { PlaylistDetailModal } from './components/Playlists/PlaylistDetailModal';
import { AddToPlaylistModal } from './components/Playlists/AddToPlaylistModal';
import { KeyboardShortcutsModal } from './components/Common/KeyboardShortcutsModal';
import { ArchitectureSection } from './components/Architecture/ArchitectureSection';
import { TrackCommentsModal } from './components/Comments/TrackCommentsModal';
import { MusicFeedImporterModal } from './components/MusicFeed/MusicFeedImporterModal';
import { EmbedPlayerModal } from './components/AudioPlayer/EmbedPlayerModal';
import { CloudConnectionStatusModal } from './components/Common/CloudConnectionStatusModal';
import { FeedbackModal } from './components/Common/FeedbackModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'app' | 'architecture'>('app');
  const [user, setUser] = useState<UserProfile>(() => loadStoredUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showLoginPage, setShowLoginPage] = useState<boolean>(false);
  const [artistThemeId, setArtistThemeId] = useState<ThemeId>(() => loadStoredTheme());
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [showLiveModal, setShowLiveModal] = useState<boolean>(false);
  const [showImporterModal, setShowImporterModal] = useState<boolean>(false);
  const [showCloudStatusModal, setShowCloudStatusModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [selectedTrackForComments, setSelectedTrackForComments] = useState<Track | null>(null);
  const [selectedTrackForEmbed, setSelectedTrackForEmbed] = useState<Track | null>(null);
  const [isEmbedPlayerOpen, setIsEmbedPlayerOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<SongCategory>('all');
  const [activeRoomName, setActiveRoomName] = useState<string | undefined>(undefined);
  const [targetRoomId, setTargetRoomId] = useState<string | null>(null);
  const [targetPasscode, setTargetPasscode] = useState<string | null>(null);
  const [sharedUrlInfo, setSharedUrlInfo] = useState<{ track: Track; url: string } | null>(null);
  const [sharedPlaylistUrlInfo, setSharedPlaylistUrlInfo] = useState<{ playlist: Playlist; url: string } | null>(null);
  const [privateAccessRestrictedPlaylist, setPrivateAccessRestrictedPlaylist] = useState<{
    title: string;
    ownerName: string;
    ownerUsername: string;
  } | null>(null);
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      // 1. Build canonical catalog with CURATED_CATALOG, COKE_STUDIO_TRACKS, ANUV_JAIN_TRACKS, and REQUESTED_SPECIAL_TRACKS
      const catalogMap = new Map<string, Track>();
      CURATED_CATALOG.forEach((t) => catalogMap.set(t.id, t));
      COKE_STUDIO_TRACKS.forEach((t) => catalogMap.set(t.id, t));
      ANUV_JAIN_TRACKS.forEach((t) => catalogMap.set(t.id, t));
      REQUESTED_SPECIAL_TRACKS.forEach((t) => catalogMap.set(t.id, t));

      // 2. Check for previously stored tracks (v7, v6, v5, or v4) to preserve user uploads & favorite states
      const saved =
        localStorage.getItem('your_melody_tracks_v7') ||
        localStorage.getItem('your_melody_tracks_v6') ||
        localStorage.getItem('your_melody_tracks_v5') ||
        localStorage.getItem('your_melody_tracks_v4');
      if (saved) {
        const parsed: Track[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userUploads: Track[] = [];
          parsed.forEach((p) => {
            if (catalogMap.has(p.id)) {
              const base = catalogMap.get(p.id)!;
              catalogMap.set(p.id, {
                ...base,
                isFavorite: typeof p.isFavorite === 'boolean' ? p.isFavorite : base.isFavorite,
                isCachedOffline: typeof p.isCachedOffline === 'boolean' ? p.isCachedOffline : base.isCachedOffline,
                playCount: Math.max(base.playCount, p.playCount || 0),
                commentsCount: commentService.getCommentCount(p.id),
              });
            } else if (p.uploaderId && p.uploaderId !== 'usr_wemusic_official') {
              userUploads.push({
                ...p,
                commentsCount: commentService.getCommentCount(p.id),
              });
            }
          });
          const combined = [...Array.from(catalogMap.values()), ...userUploads].map((t) => ({
            ...t,
            commentsCount: commentService.getCommentCount(t.id),
          }));
          return combined;
        }
      }
      return Array.from(catalogMap.values()).map((t) => ({
        ...t,
        commentsCount: commentService.getCommentCount(t.id),
      }));
    } catch {
      return CURATED_CATALOG;
    }
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const playlistMap = new Map<string, Playlist>();
      INITIAL_PLAYLISTS.forEach((p) => playlistMap.set(p.id, p));
      REQUIRED_PUBLIC_PLAYLISTS.forEach((p) => playlistMap.set(p.id, p));

      const saved = localStorage.getItem('your_melody_playlists_v2') || localStorage.getItem('your_melody_playlists');
      if (saved) {
        const parsed: Playlist[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((p) => {
            const isDummyPlaylist =
              p.id === 'pl_01' ||
              p.id === 'pl_02' ||
              p.id === 'pl_03' ||
              p.id === 'pl_04' ||
              p.ownerUsername === 'alexrivera' ||
              p.ownerUsername === 'elenarostova' ||
              p.ownerUsername === 'marcuschen' ||
              p.ownerId === 'usr_c0mmun1ty_01' ||
              p.ownerId === 'usr_c0mmun1ty_02' ||
              p.ownerId === 'usr_c0mmun1ty_03';

            if (!isDummyPlaylist && !playlistMap.has(p.id)) {
              playlistMap.set(p.id, p);
            }
          });
        }
      }
      const list = Array.from(playlistMap.values());
      // Save sanitized list to storage
      localStorage.setItem('your_melody_playlists_v2', JSON.stringify(list));
      return list;
    } catch {
      return INITIAL_PLAYLISTS;
    }
  });
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(() => {
    try {
      const savedId = localStorage.getItem('wemusic_last_selected_playlist_id');
      if (savedId && savedId !== 'pl_01' && savedId !== 'pl_02' && savedId !== 'pl_03' && savedId !== 'pl_04') {
        const found =
          INITIAL_PLAYLISTS.find((p) => p.id === savedId) ||
          REQUIRED_PUBLIC_PLAYLISTS.find((p) => p.id === savedId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [trackForPlaylist, setTrackForPlaylist] = useState<Track | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'community' | 'my_library' | 'favorites' | 'playlists'>('community');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showQueue, setShowQueue] = useState<boolean>(false);
  // Synchronize artist theme with document element and CSS variables
  useEffect(() => {
    applyThemeToDOM(artistThemeId);
  }, [artistThemeId]);

  const currentThemeMode = getTheme(artistThemeId).mode;

  const handleToggleTheme = useCallback(() => {
    setArtistThemeId((prev) => {
      const current = getTheme(prev);
      const nextId: ThemeId = current.mode === 'dark' ? 'light_studio' : 'emerald';
      saveStoredTheme(nextId);
      applyThemeToDOM(nextId);
      return nextId;
    });
  }, []);

  const handleSelectTheme = useCallback((id: ThemeId) => {
    setArtistThemeId(id);
    saveStoredTheme(id);
    applyThemeToDOM(id);
  }, []);

  // Save current user to localStorage
  useEffect(() => {
    saveStoredUser(user);
  }, [user]);

  // Active purge on mount for deprecated dummy profiles and dummy comments
  useEffect(() => {
    try {
      // 1. Purge legacy dummy user session if present
      const rawUser = localStorage.getItem('your_melody_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (
          parsed.username === 'alexrivera' ||
          parsed.username === 'elenarostova' ||
          parsed.username === 'marcuschen' ||
          parsed.id === 'usr_c0mmun1ty_01' ||
          parsed.id === 'usr_c0mmun1ty_02' ||
          parsed.id === 'usr_c0mmun1ty_03' ||
          parsed.name === 'Alex Rivera'
        ) {
          localStorage.removeItem('your_melody_user');
          setUser(createGuestUser());
        }
      }

      // 2. Cleanse any stored dummy comments so only genuine comments remain
      const rawComments = localStorage.getItem('wemusic_track_comments');
      if (rawComments) {
        const parsedComments = JSON.parse(rawComments);
        let changed = false;
        const cleanedComments: Record<string, any[]> = {};
        for (const [tId, list] of Object.entries(parsedComments)) {
          if (Array.isArray(list)) {
            const filtered = list.filter(
              (c: any) =>
                c &&
                !c.id?.startsWith('seed_') &&
                !c.id?.startsWith('cmt_seed_') &&
                c.username !== 'mayabeats' &&
                c.username !== 'rohan_audio' &&
                c.username !== 'liamvibe'
            );
            if (filtered.length !== list.length) {
              changed = true;
            }
            if (filtered.length > 0) {
              cleanedComments[tId] = filtered;
            }
          }
        }
        if (changed) {
          localStorage.setItem('wemusic_track_comments', JSON.stringify(cleanedComments));
        }
      }

      // 3. Ensure track commentsCount strictly matches genuine commentService count
      setTracks((prev) =>
        prev.map((t) => ({
          ...t,
          commentsCount: commentService.getCommentCount(t.id),
        }))
      );
    } catch (e) {
      console.warn('Storage cleanup notice:', e);
    }
  }, []);

  // Sync Supabase Authentication session and cloud database state
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    // Check active session on initial load
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const profile = mapSupabaseUserToProfile(session.user);
        setUser(profile);
        syncUserProfileToSupabase(profile);
      }
    });

    // Listen to real-time auth changes (e.g. OAuth redirects from Google)
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const profile = mapSupabaseUserToProfile(session.user);
        setUser(profile);
        syncUserProfileToSupabase(profile);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Cloud Playlists and Favorites from Supabase when an authenticated user logs in
  useEffect(() => {
    if (!user || user.isGuest || !isSupabaseConfigured()) return;

    // 1. Fetch user favorites
    fetchUserFavoritesFromSupabase(user.id).then((cloudFavIds) => {
      if (cloudFavIds.length > 0) {
        setTracks((prev) =>
          prev.map((t) => ({
            ...t,
            isFavorite: cloudFavIds.includes(t.id) ? true : t.isFavorite,
          }))
        );
      }
    });

    // 2. Fetch user playlists
    fetchUserPlaylistsFromSupabase(user.id).then((cloudPlaylists) => {
      if (cloudPlaylists.length > 0) {
        setPlaylists((prev) => {
          const map = new Map<string, Playlist>();
          // Cloud playlists take priority
          cloudPlaylists.forEach((cp) => map.set(cp.id, cp));
          // Keep existing starter public playlists
          prev.forEach((p) => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
          return Array.from(map.values());
        });
      }
    });
  }, [user.id, user.isGuest]);

  // Guest login and profile management handlers
  const handleLoginAsGuest = useCallback((customUsername?: string) => {
    const guestUser = createGuestUser(customUsername);
    setUser(guestUser);
  }, []);

  const handleUpdateProfile = useCallback((updatedProfile: UserProfile) => {
    setUser(updatedProfile);
  }, []);

  const handleSwitchUser = useCallback((newUser: UserProfile) => {
    setUser(newUser);
  }, []);

  // Community storage quota calculator (Cloudflare R2 10.0 GB quota)
  const R2_STORAGE_QUOTA_GB = 10.0;
  const totalStorageBytes = useMemo(() => {
    return tracks.reduce((acc, t) => acc + (t.fileSizeBytes || 6500000), 0);
  }, [tracks]);
  const storageGbUsed = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
  const storagePercent = ((totalStorageBytes / (R2_STORAGE_QUOTA_GB * 1024 * 1024 * 1024)) * 100).toFixed(1);

  // Core Audio Player State with localStorage persistence
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    let savedPrefs: any = null;
    try {
      const raw = localStorage.getItem('wemusic_player_prefs_v1');
      if (raw) savedPrefs = JSON.parse(raw);
    } catch {
      // ignore
    }

    const initialTrack = INITIAL_TRACKS[0];
    let initialQueue = [INITIAL_TRACKS[1], INITIAL_TRACKS[2]];

    if (savedPrefs?.queueTrackIds && Array.isArray(savedPrefs.queueTrackIds)) {
      const restoredQueue: Track[] = [];
      for (const id of savedPrefs.queueTrackIds) {
        const match = CURATED_CATALOG.find((t) => t.id === id);
        if (match) restoredQueue.push(match);
      }
      if (restoredQueue.length > 0) {
        initialQueue = restoredQueue;
      }
    }

    return {
      currentTrack: initialTrack,
      isPlaying: false,
      currentTime: 0,
      duration: initialTrack.duration,
      volume: typeof savedPrefs?.volume === 'number' ? savedPrefs.volume : 0.8,
      isMuted: typeof savedPrefs?.isMuted === 'boolean' ? savedPrefs.isMuted : false,
      playbackRate: typeof savedPrefs?.playbackRate === 'number' ? savedPrefs.playbackRate : 1.0,
      repeatMode: savedPrefs?.repeatMode === 'one' || savedPrefs?.repeatMode === 'all' ? savedPrefs.repeatMode : 'off',
      isShuffled: typeof savedPrefs?.isShuffled === 'boolean' ? savedPrefs.isShuffled : false,
      autoplayNext: typeof savedPrefs?.autoplayNext === 'boolean' ? savedPrefs.autoplayNext : true,
      crossfadeDuration: typeof savedPrefs?.crossfadeDuration === 'number' ? savedPrefs.crossfadeDuration : 4,
      queue: initialQueue,
      history: [],
      isFullScreen: false,
    };
  });

  // Persist player preferences (shuffle, repeat, volume, mute, autoplay, rate, crossfade, queue)
  useEffect(() => {
    try {
      const prefs = {
        volume: playerState.volume,
        isMuted: playerState.isMuted,
        isShuffled: playerState.isShuffled,
        repeatMode: playerState.repeatMode,
        autoplayNext: playerState.autoplayNext ?? true,
        playbackRate: playerState.playbackRate,
        crossfadeDuration: playerState.crossfadeDuration,
        queueTrackIds: playerState.queue.map((t) => t.id),
      };
      localStorage.setItem('wemusic_player_prefs_v1', JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [
    playerState.volume,
    playerState.isMuted,
    playerState.isShuffled,
    playerState.repeatMode,
    playerState.autoplayNext,
    playerState.playbackRate,
    playerState.crossfadeDuration,
    playerState.queue,
  ]);

  // Persist selected playlist
  useEffect(() => {
    try {
      if (selectedPlaylist) {
        localStorage.setItem('wemusic_last_selected_playlist_id', selectedPlaylist.id);
      } else {
        localStorage.removeItem('wemusic_last_selected_playlist_id');
      }
    } catch {
      // ignore
    }
  }, [selectedPlaylist]);

  // Persist tracks
  useEffect(() => {
    try {
      localStorage.setItem('your_melody_tracks_v7', JSON.stringify(tracks));
      localStorage.setItem('your_melody_tracks_v6', JSON.stringify(tracks));
    } catch {
      // ignore
    }
  }, [tracks]);

  // Persist playlists
  useEffect(() => {
    try {
      localStorage.setItem('your_melody_playlists_v2', JSON.stringify(playlists));
    } catch {
      // ignore
    }
  }, [playlists]);

  // Track playback time interval
  useEffect(() => {
    let timer: number;
    if (playerState.isPlaying && playerState.currentTrack) {
      timer = window.setInterval(() => {
        setPlayerState((prev) => {
          if (!prev.currentTrack) return prev;
          const engineCurrent = audioEngine.getCurrentTime();
          const nextTime = engineCurrent > 0 && Math.abs(engineCurrent - prev.currentTime) < 4
            ? engineCurrent
            : prev.currentTime + prev.playbackRate;

          // Track finished
          if (nextTime >= prev.currentTrack.duration) {
            if (prev.repeatMode === 'one') {
              audioEngine.seek(0);
              return { ...prev, currentTime: 0 };
            }

            // Move to next in queue
            if (prev.queue.length > 0) {
              const [nextTrack, ...remainingQueue] = prev.queue;
              const stream = nextTrack.previewAudioUrl || nextTrack.streamUrl;
              audioEngine.play(nextTrack.audioPreset, 0, prev.isMuted ? 0 : prev.volume, stream);
              return {
                ...prev,
                currentTrack: nextTrack,
                currentTime: 0,
                duration: nextTrack.duration,
                history: [prev.currentTrack, ...prev.history],
                queue: remainingQueue,
              };
            }

            // If queue ended but repeat all is active OR autoplay is active
            if (prev.repeatMode === 'all' || (prev.autoplayNext !== false)) {
              const curIndex = tracks.findIndex((t) => t.id === prev.currentTrack?.id);
              let nextIndex = (curIndex + 1) % tracks.length;
              if (prev.isShuffled && tracks.length > 1) {
                nextIndex = Math.floor(Math.random() * tracks.length);
                if (nextIndex === curIndex) nextIndex = (curIndex + 1) % tracks.length;
              }
              const nextTrack = tracks[nextIndex] || tracks[0];
              const stream = nextTrack.previewAudioUrl || nextTrack.streamUrl;
              audioEngine.play(nextTrack.audioPreset, 0, prev.isMuted ? 0 : prev.volume, stream);
              return {
                ...prev,
                currentTrack: nextTrack,
                currentTime: 0,
                duration: nextTrack.duration,
                history: [prev.currentTrack, ...prev.history],
              };
            }

            audioEngine.pause(prev.currentTrack.duration);
            return { ...prev, isPlaying: false, currentTime: prev.currentTrack.duration };
          }

          return { ...prev, currentTime: nextTime };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [playerState.isPlaying, playerState.currentTrack, tracks]);

  // Audio Play / Pause handler
  const handlePlayToggle = useCallback(() => {
    setPlayerState((prev) => {
      if (!prev.currentTrack) return prev;
      const willPlay = !prev.isPlaying;
      if (!willPlay) {
        audioEngine.pause(prev.currentTime);
      } else {
        const streamToPlay = prev.currentTrack.previewAudioUrl || prev.currentTrack.streamUrl;
        audioEngine.play(
          prev.currentTrack.audioPreset,
          prev.currentTime,
          prev.isMuted ? 0 : prev.volume,
          streamToPlay
        );
      }
      return { ...prev, isPlaying: willPlay };
    });
  }, []);

  // Direct Track Selection - plays native audio stream cleanly without opening YouTube
  const handlePlayTrack = useCallback((track: Track) => {
    setSelectedTrackForEmbed(track);
    const streamToPlay = track.previewAudioUrl || track.streamUrl;

    setPlayerState((prev) => {
      const isSame = prev.currentTrack?.id === track.id;
      const willPlay = isSame ? !prev.isPlaying : true;

      if (!willPlay) {
        audioEngine.pause(prev.currentTime);
      } else {
        audioEngine.play(
          track.audioPreset,
          isSame ? prev.currentTime : 0,
          prev.isMuted ? 0 : prev.volume,
          streamToPlay
        );
      }

      return {
        ...prev,
        currentTrack: track,
        currentTime: isSame ? prev.currentTime : 0,
        duration: track.duration,
        isPlaying: willPlay,
        history: prev.currentTrack && !isSame ? [prev.currentTrack, ...prev.history] : prev.history,
      };
    });
  }, []);

  // Next Track
  const handleNextTrack = useCallback(() => {
    setPlayerState((prev) => {
      let nextTrack: Track;
      let remainingQueue = prev.queue;
      if (prev.queue.length > 0) {
        [nextTrack, ...remainingQueue] = prev.queue;
      } else {
        const curIndex = tracks.findIndex((t) => t.id === prev.currentTrack?.id);
        let nextIndex = (curIndex + 1) % tracks.length;
        if (prev.isShuffled && tracks.length > 1) {
          nextIndex = Math.floor(Math.random() * tracks.length);
          if (nextIndex === curIndex) nextIndex = (curIndex + 1) % tracks.length;
        }
        nextTrack = tracks[nextIndex] || tracks[0];
      }

      setSelectedTrackForEmbed(nextTrack);
      const streamToPlay = nextTrack.previewAudioUrl || nextTrack.streamUrl;
      audioEngine.play(nextTrack.audioPreset, 0, prev.isMuted ? 0 : prev.volume, streamToPlay);

      return {
        ...prev,
        currentTrack: nextTrack,
        currentTime: 0,
        duration: nextTrack.duration,
        isPlaying: true,
        history: prev.currentTrack ? [prev.currentTrack, ...prev.history] : prev.history,
        queue: remainingQueue,
      };
    });
  }, [tracks]);

  // Prev Track
  const handlePrevTrack = useCallback(() => {
    setPlayerState((prev) => {
      if (prev.currentTime > 4) {
        audioEngine.seek(0);
        return { ...prev, currentTime: 0 };
      }
      let prevTrack: Track;
      let remainingHistory = prev.history;
      if (prev.history.length > 0) {
        [prevTrack, ...remainingHistory] = prev.history;
      } else {
        const curIndex = tracks.findIndex((t) => t.id === prev.currentTrack?.id);
        const prevIndex = (curIndex - 1 + tracks.length) % tracks.length;
        prevTrack = tracks[prevIndex] || tracks[0];
      }

      setSelectedTrackForEmbed(prevTrack);
      const streamToPlay = prevTrack.previewAudioUrl || prevTrack.streamUrl;
      audioEngine.play(prevTrack.audioPreset, 0, prev.isMuted ? 0 : prev.volume, streamToPlay);

      return {
        ...prev,
        currentTrack: prevTrack,
        currentTime: 0,
        duration: prevTrack.duration,
        isPlaying: true,
        history: remainingHistory,
        queue: prev.currentTrack ? [prev.currentTrack, ...prev.queue] : prev.queue,
      };
    });
  }, [tracks]);

  // Seek
  const handleSeek = useCallback((time: number) => {
    audioEngine.seek(time);
    setPlayerState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  // Volume
  const handleVolumeChange = useCallback((vol: number) => {
    audioEngine.setVolume(vol, false);
    setPlayerState((prev) => ({ ...prev, volume: vol, isMuted: false }));
  }, []);

  // Mute
  const handleMuteToggle = useCallback(() => {
    setPlayerState((prev) => {
      const nextMuted = !prev.isMuted;
      audioEngine.setVolume(prev.volume, nextMuted);
      return { ...prev, isMuted: nextMuted };
    });
  }, []);

  // Shuffle
  const handleShuffleToggle = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isShuffled: !prev.isShuffled }));
  }, []);

  // Repeat Mode
  const handleRepeatToggle = useCallback(() => {
    setPlayerState((prev) => {
      const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
      const nextMode = modes[(modes.indexOf(prev.repeatMode) + 1) % modes.length];
      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  // Autoplay toggle
  const handleToggleAutoplay = useCallback(() => {
    setPlayerState((prev) => ({
      ...prev,
      autoplayNext: prev.autoplayNext !== false ? false : true,
    }));
  }, []);

  // Playback Rate
  const handlePlaybackRateChange = useCallback((rate: number) => {
    audioEngine.setPlaybackRate(rate);
    setPlayerState((prev) => ({ ...prev, playbackRate: rate }));
  }, []);

  // Crossfade
  const handleCrossfadeChange = useCallback((sec: number) => {
    setPlayerState((prev) => ({ ...prev, crossfadeDuration: sec }));
  }, []);

  // Favorite toggle (Instant local response + asynchronous Supabase sync)
  const handleToggleFavorite = useCallback((trackId: string) => {
    setTracks((prev) => {
      let nextFavState = true;
      const updated = prev.map((t) => {
        if (t.id === trackId) {
          nextFavState = !t.isFavorite;
          return { ...t, isFavorite: nextFavState };
        }
        return t;
      });

      if (!user.isGuest && user.id) {
        toggleFavoriteInSupabase(user.id, trackId, nextFavState).catch((e) =>
          console.warn('Supabase favorite sync error:', e)
        );
      }

      return updated;
    });
  }, [user.id, user.isGuest]);

  // Offline Cache toggle (simulates PWA IndexedDB saving)
  const handleToggleCacheTrack = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isCachedOffline: !t.isCachedOffline } : t))
    );
  }, []);

  // Share track: generates unique shareable URL with room and track parameters and triggers ListenRoomModal
  const handleShareTrack = useCallback(
    (track: Track) => {
      const { room, shareUrl } = createShareableRoomForTrack(track, user);
      try {
        navigator.clipboard.writeText(shareUrl);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }

      setSharedUrlInfo({ track, url: shareUrl });
      setTargetRoomId(room.id);
      setTargetPasscode(room.passcode);
      setActiveRoomName(room.name);
      setShowRoomModal(true);
    },
    [user]
  );

  // Automatically trigger ListenRoomModal if URL contains room and track parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const roomIdParam = params.get('room');
    const trackIdParam = params.get('track');
    const passcodeParam = params.get('passcode') || '1234';

    if (roomIdParam) {
      let targetTrack: Track | undefined;
      if (trackIdParam) {
        targetTrack =
          tracks.find((t) => t.id === trackIdParam) ||
          CURATED_CATALOG.find((t) => t.id === trackIdParam);
      }
      const defaultTrack = targetTrack || tracks[0] || CURATED_CATALOG[0];

      const targetRoom = ensureRoomExistsForShare(
        roomIdParam,
        defaultTrack.id,
        passcodeParam,
        tracks,
        user
      );

      setTargetRoomId(roomIdParam);
      setTargetPasscode(passcodeParam);
      setActiveRoomName(targetRoom.name);
      setShowRoomModal(true);

      const trackToPlay = targetTrack || targetRoom.currentTrack || defaultTrack;
      if (trackToPlay) {
        handlePlayTrack(trackToPlay);
      }
    }

    // Automatically trigger PlaylistDetailModal or Privacy Restriction if URL contains playlist parameter
    const playlistIdParam = params.get('playlist');
    if (playlistIdParam) {
      const targetPl = playlists.find((p) => p.id === playlistIdParam);
      if (targetPl) {
        if (targetPl.isPrivate && targetPl.ownerId !== user.id) {
          // Private playlist owned by someone else: access restricted!
          setPrivateAccessRestrictedPlaylist({
            title: targetPl.title,
            ownerName: targetPl.ownerName,
            ownerUsername: targetPl.ownerUsername || 'creator',
          });
        } else {
          // Public playlist or owner is viewing: open modal
          setSelectedPlaylist(targetPl);
        }
      }
    }
  }, [tracks, user, playlists, handlePlayTrack]);

  // Upload handler
  const handleUploadSuccess = useCallback((newTrack: Track) => {
    setTracks((prev) => {
      const updated = [newTrack, ...prev];
      try {
        localStorage.setItem('your_melody_tracks_v7', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist tracks:', e);
      }
      return updated;
    });
    setActiveTab('my_library');
  }, []);

  // Delete Track handler (for uploaded tracks)
  const handleDeleteTrack = useCallback((trackToDelete: Track) => {
    setTracks((prev) => {
      const updated = prev.filter((t) => t.id !== trackToDelete.id);
      try {
        localStorage.setItem('your_melody_tracks_v7', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist tracks:', e);
      }
      return updated;
    });

    // If currently playing the deleted track, stop or advance
    setPlayerState((prev) => {
      if (prev.currentTrack?.id === trackToDelete.id) {
        audioEngine.pause(0);
        return { ...prev, isPlaying: false, currentTrack: null, currentTime: 0 };
      }
      return {
        ...prev,
        queue: prev.queue.filter((t) => t.id !== trackToDelete.id),
      };
    });
  }, []);

  // Clear all user uploaded tracks
  const handleClearAllUploads = useCallback(() => {
    if (!window.confirm('Are you sure you want to delete all your uploaded test tracks from your library?')) {
      return;
    }
    setTracks((prev) => {
      const updated = prev.filter(
        (t) =>
          t.uploaderUsername !== user.username &&
          t.uploaderUsername !== 'aloks0519' &&
          t.uploaderId !== user.id
      );
      try {
        localStorage.setItem('your_melody_tracks_v7', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist tracks:', e);
      }
      return updated;
    });
  }, [user.username, user.id]);

  // Duplicate Playlist
  const handleDuplicatePlaylist = useCallback((original: Playlist) => {
    const duplicated: Playlist = {
      ...original,
      id: `pl_${Date.now()}`,
      title: `${original.title} (Copy)`,
      ownerId: user.id,
      ownerName: user.name,
      ownerUsername: user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collaborators: [
        {
          userId: user.id,
          userName: user.name,
          username: user.username,
          userEmail: user.email,
          userAvatar: user.avatarUrl,
          role: 'OWNER',
          addedAt: new Date().toISOString(),
        },
      ],
    };
    setPlaylists((prev) => [duplicated, ...prev]);
    setSelectedPlaylist(duplicated);
  }, [user]);

  // Update collaborator role
  const handleUpdateCollaboratorRole = useCallback(
    (playlistId: string, userId: string, newRole: PlaylistAccessRole) => {
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          return {
            ...pl,
            collaborators: pl.collaborators.map((c) =>
              c.userId === userId ? { ...c, role: newRole } : c
            ),
          };
        })
      );
      if (selectedPlaylist && selectedPlaylist.id === playlistId) {
        setSelectedPlaylist((prev) =>
          prev
            ? {
                ...prev,
                collaborators: prev.collaborators.map((c) =>
                  c.userId === userId ? { ...c, role: newRole } : c
                ),
              }
            : null
        );
      }
    },
    [selectedPlaylist]
  );

  // Add collaborator
  const handleAddCollaborator = useCallback(
    (playlistId: string, email: string, role: PlaylistAccessRole) => {
      const cleanName = email.split('@')[0];
      const generatedUsername = cleanName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || `user_${Date.now().toString().slice(-4)}`;
      const newCollab = {
        userId: `usr_${Date.now()}`,
        userName: cleanName,
        username: generatedUsername,
        userEmail: email,
        userAvatar:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: role,
        addedAt: new Date().toISOString(),
      };
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          return { ...pl, collaborators: [...pl.collaborators, newCollab] };
        })
      );
      if (selectedPlaylist && selectedPlaylist.id === playlistId) {
        setSelectedPlaylist((prev) =>
          prev ? { ...prev, collaborators: [...prev.collaborators, newCollab] } : null
        );
      }
    },
    [selectedPlaylist]
  );

  // Toggle track in playlist
  const handleToggleTrackInPlaylist = useCallback((playlistId: string, track: Track) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const exists = pl.trackIds.includes(track.id);
        const newTrackIds = exists
          ? pl.trackIds.filter((id) => id !== track.id)
          : [...pl.trackIds, track.id];
        return {
          ...pl,
          trackIds: newTrackIds,
          trackCount: newTrackIds.length,
          totalDuration: exists
            ? Math.max(0, pl.totalDuration - track.duration)
            : pl.totalDuration + track.duration,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Create playlist and add track
  const handleCreatePlaylistAndAdd = useCallback(
    (title: string, track: Track, isPrivate: boolean = false) => {
      const newPl: Playlist = {
        id: `pl_${Date.now()}`,
        title: title,
        description: `Created for ${track.title}`,
        coverArtUrl: track.coverArtUrl,
        ownerId: user.id,
        ownerName: user.name,
        ownerUsername: user.username,
        isPrivate: isPrivate,
        isCollaborative: false,
        trackCount: 1,
        totalDuration: track.duration,
        trackIds: [track.id],
        collaborators: [
          {
            userId: user.id,
            userName: user.name,
            username: user.username,
            userEmail: user.email,
            userAvatar: user.avatarUrl,
            role: 'OWNER',
            addedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPlaylists((prev) => [newPl, ...prev]);
      if (!user.isGuest && isSupabaseConfigured()) {
        upsertPlaylistToSupabase(newPl).catch((e) => console.warn('Supabase playlist save error:', e));
      }
    },
    [user]
  );

  // Create playlist from User Profile
  const handleCreatePlaylistFromProfile = useCallback(
    (title: string, description: string, isPrivate: boolean, coverArtUrl?: string): Playlist => {
      const newPl: Playlist = {
        id: `pl_${Date.now()}`,
        title: title.trim(),
        description: description.trim() || (isPrivate ? 'Private collection' : 'Public community playlist'),
        coverArtUrl:
          coverArtUrl ||
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
        ownerId: user.id,
        ownerName: user.name,
        ownerUsername: user.username,
        isPrivate: isPrivate,
        isCollaborative: false,
        trackCount: 0,
        totalDuration: 0,
        trackIds: [],
        collaborators: [
          {
            userId: user.id,
            userName: user.name,
            username: user.username,
            userEmail: user.email,
            userAvatar: user.avatarUrl,
            role: 'OWNER',
            addedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPinned: false,
      };
      setPlaylists((prev) => [newPl, ...prev]);
      if (!user.isGuest && isSupabaseConfigured()) {
        upsertPlaylistToSupabase(newPl).catch((e) => console.warn('Supabase playlist save error:', e));
      }
      return newPl;
    },
    [user]
  );

  // Toggle playlist privacy (Public <-> Private)
  const handleTogglePlaylistPrivacy = useCallback((playlistId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const nextIsPrivate = !pl.isPrivate;
        const updated = {
          ...pl,
          isPrivate: nextIsPrivate,
          updatedAt: new Date().toISOString(),
        };
        if (!user.isGuest && isSupabaseConfigured() && pl.ownerId === user.id) {
          upsertPlaylistToSupabase(updated).catch((e) => console.warn('Supabase playlist privacy error:', e));
        }
        return updated;
      })
    );
    setSelectedPlaylist((prev) => {
      if (prev && prev.id === playlistId) {
        return {
          ...prev,
          isPrivate: !prev.isPrivate,
          updatedAt: new Date().toISOString(),
        };
      }
      return prev;
    });
  }, [user.id, user.isGuest]);

  // Share playlist URL
  const handleSharePlaylist = useCallback((playlist: Playlist) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shareUrl = `${origin}${pathname}?playlist=${encodeURIComponent(playlist.id)}`;
    try {
      navigator.clipboard.writeText(shareUrl);
    } catch (e) {
      console.warn('Clipboard write error:', e);
    }
    setSharedPlaylistUrlInfo({
      playlist,
      url: shareUrl,
    });
  }, []);

  // Edit playlist
  const handleEditPlaylist = useCallback(
    (playlistId: string, newTitle: string, newDescription: string) => {
      setPlaylists((prev) =>
        prev.map((pl) =>
          pl.id === playlistId
            ? { ...pl, title: newTitle, description: newDescription, updatedAt: new Date().toISOString() }
            : pl
        )
      );
      setSelectedPlaylist((prev) =>
        prev && prev.id === playlistId
          ? { ...prev, title: newTitle, description: newDescription, updatedAt: new Date().toISOString() }
          : prev
      );
    },
    []
  );

  // Delete playlist
  const handleDeletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((prev) => prev.filter((pl) => pl.id !== playlistId));
    setSelectedPlaylist(null);
    if (!user.isGuest && isSupabaseConfigured()) {
      deletePlaylistFromSupabase(playlistId).catch((e) =>
        console.warn('Supabase delete playlist error:', e)
      );
    }
  }, [user.isGuest]);

  // Remove track from playlist
  const handleRemoveTrackFromPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      const trackToRemove = tracks.find((t) => t.id === trackId);
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          const newTrackIds = pl.trackIds.filter((id) => id !== trackId);
          return {
            ...pl,
            trackIds: newTrackIds,
            trackCount: newTrackIds.length,
            totalDuration: trackToRemove
              ? Math.max(0, pl.totalDuration - trackToRemove.duration)
              : pl.totalDuration,
            updatedAt: new Date().toISOString(),
          };
        })
      );
      setSelectedPlaylist((prev) => {
        if (!prev || prev.id !== playlistId) return prev;
        const newTrackIds = prev.trackIds.filter((id) => id !== trackId);
        return {
          ...prev,
          trackIds: newTrackIds,
          trackCount: newTrackIds.length,
          totalDuration: trackToRemove
            ? Math.max(0, prev.totalDuration - trackToRemove.duration)
            : prev.totalDuration,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [tracks]
  );

  // Enqueue track (Play next / append to queue)
  const handleEnqueueTrack = useCallback((track: Track) => {
    setPlayerState((prev) => ({
      ...prev,
      queue: [...prev.queue, track],
    }));
  }, []);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayToggle();
      } else if (e.code === 'KeyM') {
        handleMuteToggle();
      } else if (e.code === 'KeyF') {
        setPlayerState((prev) => ({ ...prev, isFullScreen: !prev.isFullScreen }));
      } else if (e.code === 'KeyQ') {
        setShowQueue((prev) => !prev);
      } else if (e.code === 'KeyL' || e.code === 'ArrowRight') {
        setPlayerState((prev) => {
          if (!prev.currentTrack) return prev;
          const next = Math.min(prev.currentTrack.duration, prev.currentTime + 5);
          audioEngine.seek(next);
          return { ...prev, currentTime: next };
        });
      } else if (e.code === 'KeyJ' || e.code === 'ArrowLeft') {
        setPlayerState((prev) => {
          const next = Math.max(0, prev.currentTime - 5);
          audioEngine.seek(next);
          return { ...prev, currentTime: next };
        });
      } else if (e.code === 'Escape') {
        if (playerState.isFullScreen) {
          setPlayerState((prev) => ({ ...prev, isFullScreen: false }));
        }
        setShowUploadModal(false);
        setShowShortcutsModal(false);
        setSelectedPlaylist(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayToggle, handleMuteToggle, playerState.isFullScreen]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: tracks.length,
      coke_studio: 0,
      anuv_jain: 0,
      english: 0,
      hindi: 0,
      punjabi: 0,
      hindi_retro: 0,
    };
    for (const t of tracks) {
      const isCokeStudio =
        t.id.startsWith('trk_cs_') ||
        t.album?.toLowerCase().includes('coke studio') ||
        t.uploaderUsername === 'cokestudio';
      const isAnuvJain =
        t.id.startsWith('trk_aj_') ||
        t.artist?.toLowerCase().includes('anuv jain') ||
        t.uploaderUsername === 'anuvjain';

      if (isCokeStudio) counts.coke_studio++;
      if (isAnuvJain) counts.anuv_jain++;

      if (t.category === 'english') counts.english++;
      else if (t.category === 'hindi') counts.hindi++;
      else if (t.category === 'punjabi') counts.punjabi++;
      else if (t.category === 'hindi_retro') counts.hindi_retro++;
    }
    return counts;
  }, [tracks]);

  // Filtered tracks
  const displayedTracks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tracks.filter((t) => {
      // Offline mode filter
      if (isOfflineMode && !t.isCachedOffline) {
        return false;
      }

      // Search filter takes precedence and searches globally across the library
      if (query) {
        if (activeTab === 'favorites' && !t.isFavorite) {
          return false;
        }
        if (activeTab === 'my_library' && t.uploaderId !== user.id) {
          return false;
        }
        if (activeTab === 'community' && t.isPrivate && t.uploaderId !== user.id) {
          return false;
        }

        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesArtist = t.artist.toLowerCase().includes(query);
        const matchesAlbum = (t.album || '').toLowerCase().includes(query);
        const matchesGenre = (t.genre || '').toLowerCase().includes(query);
        const matchesUploader =
          (t.uploaderName || '').toLowerCase().includes(query) ||
          (t.uploaderUsername || '').toLowerCase().includes(query);
        const matchesCategory = (t.category || '').toLowerCase().includes(query);

        // Smart multi-token matching for complex queries (e.g. "we are one fifa", "ranjheya ve by zain zohaib", "dooron dooron by paresh pahuja", "wavin flag")
        const tokens = query
          .split(/[\s,+'"-]+/)
          .map((w) => w.trim())
          .filter((w) => w.length > 0 && w !== 'by' && w !== 'and' && w !== '&');
        const searchableCorpus = `${t.title} ${t.artist} ${t.album || ''} ${t.genre || ''} ${t.category || ''} ${t.uploaderName || ''}`.toLowerCase();
        const matchesAllTokens = tokens.length > 1 && tokens.every((tok) => searchableCorpus.includes(tok));

        // Explicit matches for Coke Studio & Anuv Jain keywords and track IDs
        const isCokeStudioTrack =
          t.id.startsWith('trk_cs_') ||
          t.album?.toLowerCase().includes('coke studio') ||
          t.uploaderUsername === 'cokestudio';
        const isAnuvJainTrack =
          t.id.startsWith('trk_aj_') ||
          t.artist?.toLowerCase().includes('anuv jain') ||
          t.uploaderUsername === 'anuvjain';

        const matchesCokeStudioQuery =
          (query.includes('coke') || query.includes('studio') || query.includes('cokestudio')) &&
          isCokeStudioTrack;
        const matchesAnuvJainQuery =
          (query.includes('anuv') || query.includes('jain') || query.includes('anuvjain')) &&
          isAnuvJainTrack;

        return (
          matchesTitle ||
          matchesArtist ||
          matchesAlbum ||
          matchesGenre ||
          matchesUploader ||
          matchesCategory ||
          matchesAllTokens ||
          matchesCokeStudioQuery ||
          matchesAnuvJainQuery
        );
      }

      // Tab filter when not searching
      if (activeTab === 'favorites' && !t.isFavorite) {
        return false;
      }
      if (activeTab === 'my_library' && t.uploaderId !== user.id) {
        return false;
      }
      if (activeTab === 'community' && t.isPrivate && t.uploaderId !== user.id) {
        return false;
      }

      // Category filter (Coke Studio, Anuv Jain, English, Hindi, Punjabi, Hindi Retro)
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'coke_studio') {
          return (
            t.id.startsWith('trk_cs_') ||
            t.album?.toLowerCase().includes('coke studio') ||
            t.uploaderUsername === 'cokestudio'
          );
        }
        if (selectedCategory === 'anuv_jain') {
          return (
            t.id.startsWith('trk_aj_') ||
            t.artist?.toLowerCase().includes('anuv jain') ||
            t.uploaderUsername === 'anuvjain'
          );
        }
        if (t.category !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [tracks, isOfflineMode, activeTab, user.id, selectedCategory, searchQuery]);

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-300 theme-canvas bg-white dark:bg-[#06120b] text-slate-900 dark:text-slate-100"
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      {/* Top Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenUpload={() => setShowUploadModal(true)}
        user={user}
        theme={currentThemeMode}
        onToggleTheme={handleToggleTheme}
        onOpenAuth={() => setShowAuthModal(true)}
        onLoginAsGuest={() => handleLoginAsGuest()}
        onOpenLogin={() => setShowLoginPage(true)}
        onOpenRooms={() => setShowRoomModal(true)}
        onOpenLiveStream={() => setShowLiveModal(true)}
        onOpenImporter={() => setShowImporterModal(true)}
        activeRoomName={activeRoomName}
        isLiveActive={true}
        onOpenCloudStatus={() => setShowCloudStatusModal(true)}
        onOpenFeedback={() => setShowFeedbackModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Navigation */}
          <nav className="w-full md:w-64 bg-white dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/80 p-4 shrink-0 flex flex-col justify-between transition-colors overflow-y-auto">
            <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold px-3 block mb-2">
                    Discovery & Library
                  </span>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('community')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        activeTab === 'community'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80'
                      }`}
                    >
                      <Compass className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <span>Community Pool</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('my_library')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        activeTab === 'my_library'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FolderLock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        <span>My Private Music</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                        {tracks.filter((t) => t.uploaderId === user.id).length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('favorites')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        activeTab === 'favorites'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                        <span>Favorite Tracks</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                        {tracks.filter((t) => t.isFavorite).length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Real-time Rooms & Live Section */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold px-3 block mb-2">
                    Live & Social Stage
                  </span>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setShowRoomModal(true)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        <span>Listen Together</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                        ROOMS
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLiveModal(true)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Radio className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                        <span>Artist Live Studio</span>
                      </div>
                      <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        LIVE
                      </span>
                    </button>
                  </div>
                </div>

                {/* Playlists Section */}
                <div>
                  <div className="flex items-center justify-between px-3 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                      Community Playlists
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newPl: Playlist = {
                          id: `pl_${Date.now()}`,
                          title: `Playlist #${playlists.length + 1}`,
                          description: 'Curated audio selection.',
                          coverArtUrl:
                            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
                          ownerId: user.id,
                          ownerName: user.name,
                          ownerUsername: user.username,
                          isPrivate: true,
                          isCollaborative: false,
                          trackCount: 0,
                          totalDuration: 0,
                          trackIds: [],
                          collaborators: [
                            {
                              userId: user.id,
                              userName: user.name,
                              username: user.username,
                              userEmail: user.email,
                              userAvatar: user.avatarUrl,
                              role: 'OWNER',
                              addedAt: new Date().toISOString(),
                            },
                          ],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        };
                        setPlaylists([newPl, ...playlists]);
                        setSelectedPlaylist(newPl);
                      }}
                      className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                      title="Create Playlist"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {playlists
                      .filter((pl) => !pl.isPrivate || pl.ownerId === user.id)
                      .map((pl) => (
                        <button
                          key={pl.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlaylist(pl);
                            setCurrentView('app');
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-900/80 group transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={pl.coverArtUrl}
                              alt={pl.title}
                              className="w-6 h-6 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                            />
                            <span className="truncate text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {pl.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {pl.isPrivate && (
                              <Lock className="w-3 h-3 text-amber-500" title="Private Playlist (Only you can access)" />
                            )}
                            {pl.isPinned && <Pin className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* System Views & Feed (Architecture, Player, and Feed tabs below Community Playlists) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold px-3 block mb-2">
                    System Views & Feeds
                  </span>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setCurrentView('app')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        currentView === 'app'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80'
                      }`}
                    >
                      <Music className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <span>Music Player</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentView('architecture')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        currentView === 'architecture'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                      <span>Architecture</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Community Storage Quota Widget (Cloudflare R2 Free Tier Safeguard) */}
              <div className="p-3.5 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs shadow-xs">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1.5 font-mono text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">R2 Storage Quota</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {storageGbUsed} GB / {R2_STORAGE_QUOTA_GB.toFixed(1)} GB
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(2, parseFloat(storagePercent))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Cloudflare R2 Free Tier</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                    $0.00 Egress
                  </span>
                </div>
              </div>
            </nav>

            {/* Main Stage: Architecture Section OR Track List & Hero Bar */}
            {currentView === 'architecture' ? (
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full pb-32">
                <ArchitectureSection />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 space-y-6 bg-white dark:bg-slate-950/40">
              {/* Offline Banner if active */}
              {isOfflineMode && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 shadow-xs">
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>PWA Offline Mode Active — Playing cached audio from browser IndexedDB.</span>
                  </div>
                  <span className="font-mono text-[11px] bg-amber-500/20 px-2 py-0.5 rounded font-semibold text-amber-900 dark:text-amber-200">
                    ServiceWorker Active
                  </span>
                </div>
              )}

              {/* Guest Session Indicator Banner */}
              {user.isGuest && (
                <div className="bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
                    <span>
                      Active Guest Session: <strong>@{user.username}</strong>. Unrestricted access with no login credentials required.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 font-semibold hover:underline cursor-pointer shrink-0 text-xs"
                  >
                    Change Username / Profile
                  </button>
                </div>
              )}

              {/* View Heading & Quick Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {activeTab === 'community' && 'Community Music Catalog'}
                    {activeTab === 'my_library' && 'My Private Music Library'}
                    {activeTab === 'favorites' && 'Favorite Tracks'}
                    {activeTab === 'playlists' && 'Playlists'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeTab === 'community' &&
                      'Stream community-contributed releases. Private uploads remain isolated to their uploader.'}
                    {activeTab === 'my_library' &&
                      'Your uploaded master tracks stored in Cloudflare R2 with $0 egress fees and encrypted streaming.'}
                    {activeTab === 'favorites' && 'Bookmarked tracks for instant queueing.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'my_library' && displayedTracks.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllUploads}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      title="Delete all uploaded test tracks"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete All Uploads</span>
                    </button>
                  )}
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-2xs">
                    {displayedTracks.length} tracks
                  </span>
                </div>
              </div>

              {/* Category Filter Pills (Coke Studio, Anuv Jain, English, Hindi, Punjabi, Retro) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {[
                    { id: 'all', label: 'All Songs', count: categoryCounts.all, icon: Sparkles },
                    { id: 'coke_studio', label: 'Coke Studio', count: categoryCounts.coke_studio, icon: Radio },
                    { id: 'anuv_jain', label: 'Anuv Jain', count: categoryCounts.anuv_jain, icon: Heart },
                    { id: 'english', label: 'English Hits', count: categoryCounts.english, icon: Globe },
                    { id: 'hindi', label: 'Hindi Bollywood', count: categoryCounts.hindi, icon: Flame },
                    { id: 'punjabi', label: 'Punjabi Hits', count: categoryCounts.punjabi, icon: Music },
                    { id: 'hindi_retro', label: 'Hindi Retro', count: categoryCounts.hindi_retro, icon: Clock },
                  ].map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id as SongCategory)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                            : 'bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-2xs'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-slate-950/20 text-slate-950 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In-page Search & Trending Query Chips */}
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Coke Studio, Anuv Jain, Pasoori, Husn, artists..."
                    className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Trending Quick Suggestions */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1 font-semibold">
                    Trending:
                  </span>
                  {[
                    { label: 'Coke Studio', query: 'coke studio' },
                    { label: 'Anuv Jain', query: 'anuv jain' },
                    { label: 'Husn', query: 'husn' },
                    { label: 'Pasoori', query: 'pasoori' },
                    { label: 'Afreen Afreen', query: 'afreen' },
                    { label: 'Jo Tum Mere Ho', query: 'jo tum mere ho' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setSearchQuery(chip.query);
                        if (activeTab !== 'community') {
                          setActiveTab('community');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                        searchQuery.toLowerCase() === chip.query.toLowerCase()
                          ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 font-semibold'
                          : 'bg-slate-100 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Search Summary Pill */}
              {searchQuery && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Results for <strong className="text-slate-900 dark:text-white">"{searchQuery}"</strong> • Found{' '}
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{displayedTracks.length}</span> matching track{displayedTracks.length === 1 ? '' : 's'} across the catalog
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium underline text-xs cursor-pointer ml-2"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {/* Direct Audio Stream Online Badge Notice */}
              <div className="bg-white dark:bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                    <strong className="text-emerald-700 dark:text-emerald-400">Direct Audio Stream Active:</strong> All songs feature real audio streams directly in your player — no external player required!
                  </span>
                </div>
                {playerState.currentTrack && (
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.pause(playerState.currentTime);
                      setSelectedTrackForEmbed(playerState.currentTrack);
                      setIsEmbedPlayerOpen(true);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-[11px] inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Tv className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                    <span>Watch Music Video</span>
                  </button>
                )}
              </div>

              {/* Track Table Card */}
              <div className="bg-white dark:bg-slate-950/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl p-2 sm:p-4 shadow-xs">
                <TrackList
                  tracks={displayedTracks}
                  currentTrackId={playerState.currentTrack?.id}
                  isPlaying={playerState.isPlaying}
                  onPlayTrack={handlePlayTrack}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleCacheTrack={handleToggleCacheTrack}
                  onAddToPlaylist={(track) => setTrackForPlaylist(track)}
                  onEnqueueTrack={handleEnqueueTrack}
                  onOpenComments={(track) => setSelectedTrackForComments(track)}
                  onShareTrack={handleShareTrack}
                  onOpenEmbedPlayer={(track) => {
                    setSelectedTrackForEmbed(track);
                    setIsEmbedPlayerOpen(true);
                  }}
                  onDeleteTrack={handleDeleteTrack}
                  currentUserId={user.id}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Audio Player Dock */}
      <BottomPlayer
        playerState={playerState}
        onPlayToggle={handlePlayToggle}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
        onShuffleToggle={handleShuffleToggle}
        onRepeatToggle={handleRepeatToggle}
        onToggleAutoplay={handleToggleAutoplay}
        onPlaybackRateChange={handlePlaybackRateChange}
        onCrossfadeChange={handleCrossfadeChange}
        onToggleQueue={() => setShowQueue(!showQueue)}
        onToggleFullScreen={() =>
          setPlayerState((prev) => ({ ...prev, isFullScreen: !prev.isFullScreen }))
        }
        onToggleCacheTrack={handleToggleCacheTrack}
        onOpenComments={(track) => setSelectedTrackForComments(track)}
        onOpenEmbedPlayer={(track) => {
          setSelectedTrackForEmbed(track);
          setIsEmbedPlayerOpen(true);
        }}
        showQueue={showQueue}
      />

      {/* Fullscreen Player Modal */}
      {playerState.isFullScreen && (
        <FullScreenPlayer
          playerState={playerState}
          onClose={() => setPlayerState((prev) => ({ ...prev, isFullScreen: false }))}
          onPlayToggle={handlePlayToggle}
          onPrev={handlePrevTrack}
          onNext={handleNextTrack}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
          onShuffleToggle={handleShuffleToggle}
          onRepeatToggle={handleRepeatToggle}
          onOpenComments={(track) => setSelectedTrackForComments(track)}
          onOpenEmbedPlayer={(track) => {
            setSelectedTrackForEmbed(track);
            setIsEmbedPlayerOpen(true);
          }}
        />
      )}

      {/* Queue Drawer */}
      {showQueue && (
        <QueueDrawer
          currentTrack={playerState.currentTrack}
          queue={playerState.queue}
          history={playerState.history}
          onClose={() => setShowQueue(false)}
          onPlayTrack={handlePlayTrack}
          onRemoveFromQueue={(index) =>
            setPlayerState((prev) => ({
              ...prev,
              queue: prev.queue.filter((_, i) => i !== index),
            }))
          }
          onClearQueue={() => setPlayerState((prev) => ({ ...prev, queue: [] }))}
        />
      )}

      {/* Upload Music Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
          currentUserId={user.id}
          currentUserName={user.name}
          currentUserUsername={user.username}
        />
      )}

      {/* User Auth & Identity Modal */}
      {showAuthModal && (
        <AuthModal
          currentUser={user}
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginAsGuest={handleLoginAsGuest}
          onUpdateProfile={handleUpdateProfile}
          onSwitchUser={handleSwitchUser}
          playlists={playlists}
          onCreatePlaylist={handleCreatePlaylistFromProfile}
          onTogglePlaylistPrivacy={handleTogglePlaylistPrivacy}
          onDeletePlaylist={handleDeletePlaylist}
          onSelectPlaylist={(pl) => {
            setSelectedPlaylist(pl);
            setShowAuthModal(false);
          }}
          onSharePlaylist={handleSharePlaylist}
          onOpenLoginPage={() => {
            setShowAuthModal(false);
            setShowLoginPage(true);
          }}
        />
      )}

      {/* Dedicated Login & Registration Page / Modal (Google, Apple, Guest) */}
      {showLoginPage && (
        <LoginPage
          isOpen={showLoginPage}
          onClose={() => setShowLoginPage(false)}
          currentUser={user}
          onLoginSuccess={(authedUser) => {
            setUser(authedUser);
            setShowLoginPage(false);
          }}
        />
      )}

      {/* Add To Playlist Modal */}
      {trackForPlaylist && (
        <AddToPlaylistModal
          track={trackForPlaylist}
          playlists={playlists}
          onClose={() => setTrackForPlaylist(null)}
          onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
          onCreatePlaylistAndAdd={handleCreatePlaylistAndAdd}
        />
      )}

      {/* Playlist Detail Modal */}
      {selectedPlaylist && (
        <PlaylistDetailModal
          playlist={selectedPlaylist}
          currentUser={user}
          allTracks={tracks}
          currentTrackId={playerState.currentTrack?.id}
          isPlaying={playerState.isPlaying}
          onClose={() => setSelectedPlaylist(null)}
          onPlayTrack={handlePlayTrack}
          onToggleFavorite={handleToggleFavorite}
          onToggleCacheTrack={handleToggleCacheTrack}
          onDuplicatePlaylist={handleDuplicatePlaylist}
          onUpdateCollaboratorRole={handleUpdateCollaboratorRole}
          onAddCollaborator={handleAddCollaborator}
          onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
          onEditPlaylist={handleEditPlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onEnqueueTrack={handleEnqueueTrack}
          onTogglePrivacy={handleTogglePlaylistPrivacy}
          onSharePlaylist={handleSharePlaylist}
          onOpenEmbedPlayer={(track) => {
            setSelectedTrackForEmbed(track);
            setIsEmbedPlayerOpen(true);
          }}
        />
      )}

      {/* Keyboard Shortcuts Dialog */}
      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}

      {/* Supreme Artist Themes Selector Modal */}
      <ThemeSelectorModal
        currentThemeId={artistThemeId}
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        onSelectTheme={handleSelectTheme}
      />

      {/* Listen Together Synchronized Audio Room Modal */}
      <ListenRoomModal
        isOpen={showRoomModal}
        onClose={() => {
          setShowRoomModal(false);
          setTargetRoomId(null);
          setTargetPasscode(null);
        }}
        currentUser={user}
        allTracks={tracks}
        currentTrack={playerState.currentTrack}
        isPlaying={playerState.isPlaying}
        onPlayTrack={handlePlayTrack}
        onTogglePlayPause={handlePlayToggle}
        onSeek={handleSeek}
        initialRoomId={targetRoomId}
        initialPasscode={targetPasscode}
        onActiveRoomChange={setActiveRoomName}
      />

      {/* Artist Live Broadcast Studio & Audience Stream */}
      <LiveStreamModal
        isOpen={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        currentUser={user}
        allTracks={tracks}
        currentTrack={playerState.currentTrack}
        isPlaying={playerState.isPlaying}
        onPlayTrack={handlePlayTrack}
        onTogglePlayPause={handlePlayToggle}
      />

      {/* Track Comments & Discussions Modal (with Guest Mode restriction) */}
      <TrackCommentsModal
        isOpen={!!selectedTrackForComments}
        onClose={() => setSelectedTrackForComments(null)}
        track={selectedTrackForComments}
        currentUser={user}
        currentPlaybackTime={
          playerState.currentTrack?.id === selectedTrackForComments?.id
            ? playerState.currentTime
            : 0
        }
        onOpenAuthModal={() => {
          setSelectedTrackForComments(null);
          setShowAuthModal(true);
        }}
        onSeekToTimestamp={(seconds) => {
          if (playerState.currentTrack?.id === selectedTrackForComments?.id) {
            handleSeek(seconds);
          } else if (selectedTrackForComments) {
            handlePlayTrack(selectedTrackForComments);
            setTimeout(() => handleSeek(seconds), 300);
          }
        }}
        onCommentCountChange={(trackId, newCount) => {
          setTracks((prev) =>
            prev.map((t) => (t.id === trackId ? { ...t, commentsCount: newCount } : t))
          );
        }}
      />

      {/* Music Feed & Public API Importer Modal */}
      <MusicFeedImporterModal
        isOpen={showImporterModal}
        onClose={() => setShowImporterModal(false)}
        onReplaceFeedWithCurated={(newCatalog) => {
          setTracks(newCatalog);
          localStorage.setItem('your_melody_tracks', JSON.stringify(newCatalog));
        }}
        onAppendTracksToFeed={(tracksToAdd) => {
          setTracks((prev) => {
            const combined = [...tracksToAdd, ...prev];
            localStorage.setItem('your_melody_tracks', JSON.stringify(combined));
            return combined;
          });
        }}
        onPlayPreviewTrack={handlePlayTrack}
      />

      {/* Share URL Generated Toast Notification */}
      {sharedUrlInfo && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-900/95 border border-emerald-500/40 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Room Link Copied!</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                  Ready to share
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 truncate">
                {sharedUrlInfo.track.title} • {sharedUrlInfo.track.artist}
              </p>
              <div className="mt-2 text-[10px] font-mono bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 text-slate-400 truncate select-all">
                {sharedUrlInfo.url}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSharedUrlInfo(null)}
              className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Public Playlist Share URL Copied Toast Notification */}
      {sharedPlaylistUrlInfo && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-900/95 border border-emerald-500/40 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white">Public Playlist Link Copied!</h4>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                  Shareable
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 truncate font-semibold">
                "{sharedPlaylistUrlInfo.playlist.title}"
              </p>
              <p className="text-[10px] text-slate-400">
                Curated by @{sharedPlaylistUrlInfo.playlist.ownerUsername || sharedPlaylistUrlInfo.playlist.ownerName}
              </p>
              <div className="mt-2 text-[10px] font-mono bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 text-slate-400 truncate select-all">
                {sharedPlaylistUrlInfo.url}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSharedPlaylistUrlInfo(null)}
              className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Private Playlist Access Restricted Modal */}
      {privateAccessRestrictedPlaylist && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl text-slate-900 dark:text-slate-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-3.5">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Private Playlist Access Restricted
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              The playlist <span className="font-bold text-slate-900 dark:text-white">"{privateAccessRestrictedPlaylist.title}"</span> is currently marked as <span className="text-amber-600 dark:text-amber-400 font-bold">Private</span> by @{privateAccessRestrictedPlaylist.ownerUsername}.
            </p>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-left text-xs text-slate-600 dark:text-slate-400 w-full mb-4 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Access Policy</span>
              </div>
              <p className="text-[11px] leading-normal">
                Private playlists are restricted strictly to their creator. If this is your playlist, ensure you are logged into the correct account. Otherwise, the creator must set it to Public to share it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPrivateAccessRestrictedPlaylist(null);
                // Clear query parameter cleanly
                if (typeof window !== 'undefined' && window.history) {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('playlist');
                  window.history.replaceState({}, '', url.toString());
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Return to Music Library
            </button>
          </div>
        </div>
      )}

      {/* YouTube & Spotify Official Embed Player Modal */}
      <EmbedPlayerModal
        isOpen={isEmbedPlayerOpen && Boolean(selectedTrackForEmbed || playerState.currentTrack)}
        track={selectedTrackForEmbed || playerState.currentTrack}
        isPlaying={playerState.isPlaying}
        onClose={() => setIsEmbedPlayerOpen(false)}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
        onTogglePlay={handlePlayToggle}
        onPauseNativeAudio={() => {
          audioEngine.pause(0);
        }}
        initialPip={true}
      />

      {/* Cloud Infrastructure Health Check Modal */}
      <CloudConnectionStatusModal
        isOpen={showCloudStatusModal}
        onClose={() => setShowCloudStatusModal(false)}
      />

      {/* User Feedback Submission Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        user={user}
      />
    </div>
  );
}
