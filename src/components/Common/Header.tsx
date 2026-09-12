import React, { useRef } from 'react';
import {
  Search,
  UploadCloud,
  Sun,
  Moon,
  Radio,
  Users,
  X,
  LogIn,
  User,
  MessageSquareHeart,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { WeMusicLogo } from './WeMusicLogo';

interface HeaderProps {
  currentView: 'app' | 'architecture';
  onViewChange: (view: 'app' | 'architecture') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenUpload: () => void;
  user: UserProfile;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onLoginAsGuest: () => void;
  onOpenLogin?: () => void;
  onOpenRooms?: () => void;
  onOpenLiveStream?: () => void;
  onOpenImporter?: () => void;
  activeRoomName?: string;
  isLiveActive?: boolean;
  onOpenCloudStatus?: () => void;
  onOpenFeedback?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  searchQuery,
  onSearchChange,
  onOpenUpload,
  user,
  theme,
  onToggleTheme,
  onOpenAuth,
  onOpenLogin,
  onOpenRooms,
  onOpenLiveStream,
  onOpenImporter,
  activeRoomName,
  onOpenCloudStatus,
  onOpenFeedback,
}) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2.5 sm:gap-4 sticky top-0 z-30 select-none transition-colors w-full overflow-hidden shadow-xs dark:shadow-none">
      {/* Brand Logo */}
      <div className="flex items-center shrink-0">
        <WeMusicLogo
          onClick={() => {
            onViewChange('app');
            onSearchChange('');
          }}
        />
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md min-w-[120px]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Coke Studio, Anuv Jain, songs..."
            className="w-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500/50 transition font-sans shadow-xs dark:shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Action Bar (Compact & responsive to eliminate horizontal scrolling) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Real-time Listen Together / Rooms Button */}
        {onOpenRooms && (
          <button
            type="button"
            onClick={onOpenRooms}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
              activeRoomName
                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800'
            }`}
            title="Listen Together in Real-time Synchronized Rooms"
          >
            <Users className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Room</span>
            {activeRoomName && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            )}
          </button>
        )}

        {/* Artist Live Broadcast Button */}
        {onOpenLiveStream && (
          <button
            type="button"
            onClick={onOpenLiveStream}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 cursor-pointer"
            title="Artist Live Broadcast Stage"
          >
            <Radio className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span className="hidden lg:inline">Live Stage</span>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
          </button>
        )}

        {/* Upload Music Button */}
        <button
          type="button"
          onClick={onOpenUpload}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20 cursor-pointer"
          title="Upload Audio Track to Cloudflare R2"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Cloud Infrastructure Health Status Pill */}
        {onOpenCloudStatus && (
          <button
            type="button"
            onClick={onOpenCloudStatus}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:border-slate-800 hover:border-emerald-500/50 text-[11px] font-mono dark:text-slate-300 transition cursor-pointer"
            title="Check Supabase & Cloudflare R2 Connection"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold hidden md:inline">Cloud Live</span>
          </button>
        )}

        {/* Feedback Button */}
        {onOpenFeedback && (
          <button
            type="button"
            onClick={onOpenFeedback}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 hover:border-emerald-500/40 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
            title="Submit Feedback & Suggestions"
          >
            <MessageSquareHeart className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="hidden sm:inline">Feedback</span>
          </button>
        )}

        {/* Light / Dark Mode Toggle Symbol (Placed right beside Feedback) */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          title={theme === 'dark' ? 'Switch to Clean Light Studio' : 'Switch to Dark Mode (Studio Emerald)'}
          aria-label="Toggle Light and Dark Mode"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-emerald-600" />
          )}
        </button>

        {/* Sign In / Register Button */}
        <button
          id="header-sign-in-btn"
          type="button"
          onClick={onOpenLogin || onOpenAuth}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${
            user.isGuest
              ? 'bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800'
          }`}
          title={user.isGuest ? 'Sign in with Google, Apple, or Instant Guest' : `Signed in as ${user.name}`}
        >
          {user.isGuest ? (
            <LogIn className="w-3.5 h-3.5" />
          ) : (
            <User className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          )}
          <span className="hidden sm:inline">{user.isGuest ? 'Sign In' : 'Account'}</span>
        </button>

        {/* User Profile Avatar */}
        <button
          id="header-user-profile-btn"
          type="button"
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-800 hover:opacity-85 transition text-left cursor-pointer p-1 rounded-xl shrink-0"
          title={`Profile: ${user.name} (@${user.username})`}
        >
          <div className="relative shrink-0">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
            <span
              title={user.isGuest ? 'Guest User' : 'Community Member'}
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-slate-950 flex items-center justify-center text-[8px] font-bold ${
                user.isGuest
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-emerald-500 text-slate-950'
              }`}
            >
              {user.isGuest ? '?' : 'G'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
