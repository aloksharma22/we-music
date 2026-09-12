import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  AtSign,
  UserCheck,
  Sparkles,
  LogIn,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Globe,
  Lock,
  Share2,
  Trash2,
  ExternalLink,
  Check,
  Copy,
  Eye,
  FolderPlus,
  ArrowLeft,
  Music2,
  HardDrive
} from 'lucide-react';
import { UserProfile, Playlist } from '../../types';
import { createGuestUser, validateUsername, generateGuestAvatar } from '../../services/authService';
import { INITIAL_USER, COMMUNITY_PROFILES } from '../../data/initialTracks';

interface AuthModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onLoginAsGuest: (customUsername?: string) => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onSwitchUser: (newUser: UserProfile) => void;
  playlists?: Playlist[];
  onCreatePlaylist?: (title: string, description: string, isPrivate: boolean, coverArtUrl?: string) => Playlist;
  onTogglePlaylistPrivacy?: (playlistId: string) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  onSelectPlaylist?: (playlist: Playlist) => void;
  onSharePlaylist?: (playlist: Playlist) => void;
  onOpenLoginPage?: () => void;
  initialTab?: 'playlists' | 'profile' | 'guest_login' | 'switch_user';
  initialTargetUserId?: string;
}

const COVER_ART_PRESETS = [
  {
    name: 'Neon Twilight',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cosmic Ambient',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Modular Synth',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Studio Master',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Vinyl Lo-Fi',
    url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&auto=format&fit=crop&q=80',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onLoginAsGuest,
  onUpdateProfile,
  onSwitchUser,
  playlists = [],
  onCreatePlaylist,
  onTogglePlaylistPrivacy,
  onDeletePlaylist,
  onSelectPlaylist,
  onSharePlaylist,
  onOpenLoginPage,
  initialTab = 'playlists',
  initialTargetUserId,
}) => {
  const [activeTab, setActiveTab] = useState<'playlists' | 'profile' | 'guest_login' | 'switch_user'>(initialTab);
  const [editName, setEditName] = useState<string>(currentUser.name);
  const [editUsername, setEditUsername] = useState<string>(currentUser.username);
  const [guestCustomUsername, setGuestCustomUsername] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile viewing state (defaults to viewing currentUser, but user can view other community members' profiles)
  const [viewingUserId, setViewingUserId] = useState<string>(initialTargetUserId || currentUser.id);

  // Sync viewing user when currentUser changes (unless viewing another user explicitly)
  useEffect(() => {
    if (!initialTargetUserId) {
      setViewingUserId(currentUser.id);
    }
  }, [currentUser.id, initialTargetUserId]);

  // Playlist creation state in Profile
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newIsPrivate, setNewIsPrivate] = useState<boolean>(false); // default public as community first
  const [selectedCoverArt, setSelectedCoverArt] = useState<string>(COVER_ART_PRESETS[0].url);

  // Filter state for playlists in profile
  const [playlistFilter, setPlaylistFilter] = useState<'all' | 'public' | 'private'>('all');
  const [copiedPlaylistId, setCopiedPlaylistId] = useState<string | null>(null);

  // Determine which user is being viewed in the profile
  const allKnownUsers: UserProfile[] = useMemo(() => {
    const list = [...COMMUNITY_PROFILES].filter(
      (u) =>
        u.username !== 'alexrivera' &&
        u.username !== 'elenarostova' &&
        u.username !== 'marcuschen' &&
        u.id !== 'usr_c0mmun1ty_01' &&
        u.id !== 'usr_c0mmun1ty_02' &&
        u.id !== 'usr_c0mmun1ty_03'
    );
    if (!list.some((u) => u.id === currentUser.id)) {
      list.push(currentUser);
    }
    return list;
  }, [currentUser]);

  const viewingUser = useMemo(() => {
    return allKnownUsers.find((u) => u.id === viewingUserId) || currentUser;
  }, [allKnownUsers, viewingUserId, currentUser]);

  const isViewingSelf = viewingUser.id === currentUser.id;

  // Filter playlists belonging to the user being viewed
  // RULE: If viewing self, show all playlists. If viewing another user, show ONLY public playlists!
  const userPlaylists = useMemo(() => {
    return playlists.filter((pl) => {
      if (pl.ownerId !== viewingUser.id) return false;
      if (!isViewingSelf && pl.isPrivate) {
        // STRICT PRIVACY: other users cannot see private playlists!
        return false;
      }
      if (playlistFilter === 'public') return !pl.isPrivate;
      if (playlistFilter === 'private') return pl.isPrivate;
      return true;
    });
  }, [playlists, viewingUser.id, isViewingSelf, playlistFilter]);

  const totalUserPlaylists = useMemo(() => {
    return playlists.filter((pl) => pl.ownerId === viewingUser.id);
  }, [playlists, viewingUser.id]);

  const publicPlaylistsCount = useMemo(() => {
    return totalUserPlaylists.filter((p) => !p.isPrivate).length;
  }, [totalUserPlaylists]);

  const privatePlaylistsCount = useMemo(() => {
    return totalUserPlaylists.filter((p) => p.isPrivate).length;
  }, [totalUserPlaylists]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateUsername(editUsername);
    if (!val.valid) {
      setFeedbackMsg({ type: 'error', text: val.message || 'Invalid username' });
      return;
    }

    const updated: UserProfile = {
      ...currentUser,
      name: editName.trim() || 'Anonymous User',
      username: val.clean,
      avatarUrl: currentUser.isGuest ? generateGuestAvatar(val.clean) : currentUser.avatarUrl,
      lastActiveAt: new Date().toISOString(),
    };

    onUpdateProfile(updated);
    setFeedbackMsg({ type: 'success', text: `Profile updated to @${val.clean}` });
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please enter a title for your playlist' });
      return;
    }

    if (onCreatePlaylist) {
      const created = onCreatePlaylist(newTitle.trim(), newDescription.trim(), newIsPrivate, selectedCoverArt);
      setFeedbackMsg({
        type: 'success',
        text: `Created ${newIsPrivate ? 'Private' : 'Public'} Playlist "${created.title}"`,
      });
      setNewTitle('');
      setNewDescription('');
      setShowCreateForm(false);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleSharePlaylistUrl = (pl: Playlist) => {
    if (pl.isPrivate && !isViewingSelf) {
      setFeedbackMsg({
        type: 'error',
        text: 'This playlist is private and restricted to its owner.',
      });
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shareUrl = `${origin}${pathname}?playlist=${encodeURIComponent(pl.id)}`;

    try {
      navigator.clipboard.writeText(shareUrl);
      setCopiedPlaylistId(pl.id);
      setFeedbackMsg({
        type: 'success',
        text: `Public Playlist URL copied! Ready to share with anyone.`,
      });
      setTimeout(() => setCopiedPlaylistId(null), 2500);
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }

    if (onSharePlaylist) {
      onSharePlaylist(pl);
    }
  };

  const handleInstantGuestLogin = () => {
    let chosenUsername: string | undefined = undefined;
    if (guestCustomUsername.trim()) {
      const val = validateUsername(guestCustomUsername);
      if (!val.valid) {
        setFeedbackMsg({ type: 'error', text: val.message || 'Invalid username' });
        return;
      }
      chosenUsername = val.clean;
    }
    onLoginAsGuest(chosenUsername);
    onClose();
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auth-modal-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-all"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-500/40 shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{currentUser.name}</h3>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">@{currentUser.username}</p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5 pt-3 gap-3 sm:gap-4 bg-slate-50/50 dark:bg-slate-950/20 overflow-x-auto">
          <button
            id="auth-tab-playlists"
            type="button"
            onClick={() => setActiveTab('playlists')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'playlists'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>Playlists</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 dark:bg-slate-800 font-mono">
              {playlists.filter((p) => p.ownerId === viewingUser.id).length}
            </span>
          </button>

          <button
            id="auth-tab-profile"
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          <button
            id="auth-tab-switch-user"
            type="button"
            onClick={() => setActiveTab('switch_user')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'switch_user'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </button>

          <button
            id="auth-tab-guest"
            type="button"
            onClick={() => setActiveTab('guest_login')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'guest_login'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Guest Mode</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mx-4 sm:mx-5 mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: PLAYLISTS & CREATION */}
          {activeTab === 'playlists' && (
            <div className="space-y-4">
              {/* Profile Viewer Switcher Header */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={viewingUser.avatarUrl}
                    alt={viewingUser.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{viewingUser.name}</span>
                      {isViewingSelf ? (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded">
                          Your Profile
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 rounded">
                          Public Profile
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">@{viewingUser.username}</p>
                  </div>
                </div>

                {/* Profile Selector to see other users' public playlists */}
                {allKnownUsers.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-mono">View Member:</span>
                    {allKnownUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setViewingUserId(u.id);
                          setShowCreateForm(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          viewingUserId === u.id
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold shadow-xs'
                            : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                        }`}
                        title={`View ${u.name}'s profile and playlists`}
                      >
                        @{u.username}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy Notice Banner when viewing another user */}
              {!isViewingSelf && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Public View Mode:</span> You are viewing{' '}
                    <span className="font-semibold">@{viewingUser.username}</span>'s profile. Only their{' '}
                    <span className="underline font-bold">Public</span> playlists are visible. Any private playlists are
                    strictly protected and accessible only by @{viewingUser.username}. You can share any public playlist
                    URL with others!
                  </div>
                </div>
              )}

              {/* Section Header & Create Playlist Button (for own profile) */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{isViewingSelf ? 'My Playlists' : `${viewingUser.name}'s Public Playlists`}</span>
                    <span className="text-xs text-slate-500 font-mono font-normal">({userPlaylists.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isViewingSelf
                      ? 'Create public or private playlists. Public playlists can be viewed and shared by anyone.'
                      : `Browse and share @${viewingUser.username}'s public curated playlists.`}
                  </p>
                </div>

                {isViewingSelf && (
                  <button
                    id="create-playlist-toggle-btn"
                    type="button"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-semibold transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showCreateForm ? 'Cancel' : 'Create Playlist'}</span>
                  </button>
                )}
              </div>

              {/* Create Playlist Form (when viewing own profile and opened) */}
              {isViewingSelf && showCreateForm && (
                <form
                  onSubmit={handleCreatePlaylistSubmit}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-emerald-500/30 space-y-3.5 shadow-sm animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4" />
                      Create New Playlist
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Curated by @{currentUser.username}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Playlist Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Sunset Lo-Fi & Midnight Beats"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="e.g. Melodic synthwave, relaxing acoustic frequencies, and ambient textures"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Privacy Setting Selector (Public vs Private) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Playlist Privacy Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Public Choice */}
                      <button
                        type="button"
                        onClick={() => setNewIsPrivate(false)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          !newIsPrivate
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <Globe className="w-4 h-4 text-emerald-500" />
                          <span>Public Playlist</span>
                          {!newIsPrivate && (
                            <span className="ml-auto text-[10px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-mono">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                          Visible to other users on your profile. Anyone can view, listen, and share the URL to someone!
                        </p>
                      </button>

                      {/* Private Choice */}
                      <button
                        type="button"
                        onClick={() => setNewIsPrivate(true)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          newIsPrivate
                            ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <Lock className="w-4 h-4 text-amber-500" />
                          <span>Private Playlist</span>
                          {newIsPrivate && (
                            <span className="ml-auto text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-mono">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                          Only you can access this playlist. Hidden from other users and blocked if accessed via URL.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Cover Art Presets */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Cover Art Theme
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {COVER_ART_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setSelectedCoverArt(p.url)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs shrink-0 transition cursor-pointer ${
                            selectedCoverArt === p.url
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <img src={p.url} alt={p.name} className="w-4 h-4 rounded object-cover" />
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Playlist</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Filters for own profile */}
              {isViewingSelf && (
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-mono mr-1">Filter:</span>
                  <button
                    type="button"
                    onClick={() => setPlaylistFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      playlistFilter === 'all'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All ({totalUserPlaylists.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaylistFilter('public')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                      playlistFilter === 'public'
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Globe className="w-3 h-3 text-emerald-500" />
                    <span>Public ({publicPlaylistsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaylistFilter('private')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                      playlistFilter === 'private'
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Lock className="w-3 h-3 text-amber-500" />
                    <span>Private ({privatePlaylistsCount})</span>
                  </button>
                </div>
              )}

              {/* Playlists List */}
              <div className="space-y-2.5">
                {userPlaylists.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
                    <Music2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isViewingSelf
                        ? playlistFilter === 'all'
                          ? 'You have not created any playlists yet.'
                          : `No ${playlistFilter} playlists found.`
                        : `No public playlists found for @${viewingUser.username}.`}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isViewingSelf
                        ? 'Click "Create Playlist" above to start curating!'
                        : 'Any private playlists created by this user are protected and not visible.'}
                    </p>
                  </div>
                ) : (
                  userPlaylists.map((pl) => {
                    const isCopied = copiedPlaylistId === pl.id;
                    const durationMin = Math.floor(pl.totalDuration / 60);

                    return (
                      <div
                        key={pl.id}
                        className={`p-3 sm:p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          pl.isPrivate
                            ? 'bg-amber-500/5 dark:bg-amber-500/5 border-amber-500/30'
                            : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Left: Thumbnail & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={pl.coverArtUrl}
                            alt={pl.title}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-xs"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {pl.title}
                              </h5>
                              {pl.isPrivate ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Private (Only You)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                  <Globe className="w-2.5 h-2.5" />
                                  <span>Public</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm mt-0.5">
                              {pl.description || 'Curated community playlist'}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {pl.trackCount} tracks • {durationMin} min • by @{pl.ownerUsername || pl.ownerName}
                            </p>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {/* 1. Share URL Button (Available for public playlists, or tells user if private) */}
                          {!pl.isPrivate ? (
                            <button
                              type="button"
                              onClick={() => handleSharePlaylistUrl(pl)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
                              title="Copy & share public playlist URL"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>URL Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Share URL</span>
                                </>
                              )}
                            </button>
                          ) : isViewingSelf ? (
                            <span
                              className="text-[10px] text-amber-600 dark:text-amber-400 font-mono px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20"
                              title="Private playlists cannot be shared via URL"
                            >
                              Private (Hidden)
                            </span>
                          ) : null}

                          {/* 2. Privacy Toggle (Only for Owner) */}
                          {isViewingSelf && onTogglePlaylistPrivacy && (
                            <button
                              type="button"
                              onClick={() => onTogglePlaylistPrivacy(pl.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
                                pl.isPrivate
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border-amber-500/30'
                                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700'
                              }`}
                              title={
                                pl.isPrivate
                                  ? 'Click to make Public (anyone can view and share)'
                                  : 'Click to make Private (restricted to your account only)'
                              }
                            >
                              {pl.isPrivate ? (
                                <>
                                  <Globe className="w-3 h-3" />
                                  <span>Make Public</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Make Private</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* 3. Open Playlist Details */}
                          {onSelectPlaylist && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectPlaylist(pl);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                              title="Open playlist view"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Open</span>
                            </button>
                          )}

                          {/* 4. Delete Playlist (Only for Owner) */}
                          {isViewingSelf && onDeletePlaylist && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete playlist "${pl.title}"?`)) {
                                  onDeletePlaylist(pl.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                              title="Delete playlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EDIT PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Identity Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</h4>
                    {currentUser.isGuest ? (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30">
                        Guest
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        {currentUser.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    @{currentUser.username}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {currentUser.email} • <span className="capitalize">{currentUser.authProvider || 'Guest'} Auth</span>
                  </p>
                </div>
                {onOpenLoginPage && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLoginPage();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold transition shrink-0 cursor-pointer"
                  >
                    Change / Sign In
                  </button>
                )}
              </div>

              {/* Edit Fields */}
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="auth-input-username"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Unique Username
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-input-username"
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="e.g. soundcrafter, melody_fan"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Used to attribute your public tracks and playlists across the community.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="auth-input-name"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Display Name
                  </label>
                  <input
                    id="auth-input-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  id="auth-save-profile-btn"
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-semibold text-xs transition shadow-sm cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SWITCH ACCOUNT */}
          {activeTab === 'switch_user' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
                <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Switch User Session</span>
                </h5>
                <p className="text-slate-500 dark:text-slate-400 leading-normal">
                  Switch between accounts to test playlist privacy. Verify that public playlists are visible to anyone
                  and shareable via URL, while private playlists are restricted exclusively to their creator.
                </p>
              </div>

              <div className="space-y-2.5">
                {allKnownUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;

                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                        isCurrent
                          ? 'bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-500/10'
                          : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {u.name}
                            </span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                              {u.role}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.2 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                            @{u.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCurrent ? (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                            <Check className="w-3.5 h-3.5" />
                            <span>Current</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSwitchUser(u);
                              setEditName(u.name);
                              setEditUsername(u.username);
                              setViewingUserId(u.id);
                              setFeedbackMsg({
                                type: 'success',
                                text: `Switched session to ${u.name} (@${u.username})`,
                              });
                              setTimeout(() => setFeedbackMsg(null), 2500);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
                          >
                            Switch to this User
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: GUEST MODE */}
          {activeTab === 'guest_login' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Zero-Credential Guest Mode</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Experience the music platform immediately. No email, password, or sign-up required. A guest session
                  allows you to create public and private playlists and test listening to other users' public playlists.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="auth-guest-username-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Preferred Guest Username (Optional)
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-guest-username-input"
                      type="text"
                      value={guestCustomUsername}
                      onChange={(e) => setGuestCustomUsername(e.target.value)}
                      placeholder="Leave empty for auto-generated (e.g. guest_4821)"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <button
                  id="auth-execute-guest-login-btn"
                  type="button"
                  onClick={handleInstantGuestLogin}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login as Guest</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
