import React, { useState } from 'react';
import {
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Headphones,
  HelpCircle,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
  AtSign
} from 'lucide-react';
import { UserProfile } from '../../types';
import {
  isSupabaseConfigured,
  signInWithGoogleOAuth,
  signInAsGuestListener
} from '../../services/supabaseClient';

interface LoginPageProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  currentUser?: UserProfile;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'guest' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);
  const [customGuestName, setCustomGuestName] = useState<string>('');
  const [showGuestOptions, setShowGuestOptions] = useState<boolean>(false);

  const supabaseReady = isSupabaseConfigured();

  if (!isOpen) return null;

  // Handle Google Sign-In
  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    setLoadingProvider('google');

    if (supabaseReady) {
      const res = await signInWithGoogleOAuth();
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to initiate Google authentication with Supabase.');
        setIsLoading(false);
        setLoadingProvider(null);
      }
      // If success, Supabase will redirect to Google's consent screen
    } else {
      // Mock / Preview fallback with clear explanation
      setTimeout(() => {
        const mockUser: UserProfile = {
          id: `usr_google_${Date.now().toString(36)}`,
          name: 'Google Listener',
          username: 'google_user',
          email: 'listener@gmail.com',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          role: 'MEMBER',
          authProvider: 'google',
          isGuest: false,
          storageUsedBytes: 0,
          storageQuotaBytes: 15 * 1024 * 1024 * 1024,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        };
        onLoginSuccess(mockUser);
        setSuccessMsg('Signed in with Google Account (Preview mode). Connect Supabase to enable real OAuth tokens.');
        setIsLoading(false);
        setLoadingProvider(null);
        setTimeout(() => {
          onClose();
        }, 1200);
      }, 700);
    }
  };

  // Handle Guest Listener Login (Instant 1-Click Access)
  const handleGuestAuth = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    setLoadingProvider('guest');

    try {
      const res = await signInAsGuestListener(customGuestName.trim() || undefined);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        setSuccessMsg(`Welcome, ${res.user.name}! Zero sign-up required.`);
        setTimeout(() => {
          setIsLoading(false);
          setLoadingProvider(null);
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.error || 'Could not initialize guest session.');
        setIsLoading(false);
        setLoadingProvider(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating guest session');
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  return (
    <div
      id="login-page-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="login-card-container"
        className="w-full max-w-md bg-white dark:bg-[#0D131F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 transition-all duration-200"
      >
        {/* Top Bar with Back / Close Button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40">
          <button
            id="login-back-button"
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Player</span>
          </button>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60">
            {supabaseReady ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Supabase Ready</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-amber-700 dark:text-amber-300">Local Auth Active</span>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Headphones className="w-6 h-6 text-slate-950" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome to <span className="text-emerald-600 dark:text-emerald-400">We Music</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Listen to curated lossless albums, live synchronized rooms, and high-fidelity anthems.
            </p>
          </div>

          {/* If running inside AI Studio preview iframe, offer open in new tab */}
          {window.self !== window.top && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between gap-3">
              <span className="text-[11px] leading-snug">
                For Google OAuth, open app in a new window to prevent iframe block:
              </span>
              <a
                id="login-open-new-tab"
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-[11px] transition shadow"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Three Authentication Actions */}
          <div className="space-y-3">
            {/* 1. Google Account Button */}
            <button
              id="auth-btn-google"
              type="button"
              disabled={isLoading}
              onClick={handleGoogleAuth}
              className="w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-3 border border-slate-300 dark:border-transparent shadow-sm hover:shadow active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative py-2 flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-[#0D131F] px-3 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                Or Instant Access
              </span>
            </div>

            {/* 3. Guest Listener Button (Instant 1-Click Access) */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Guest Listener (No Sign-Up)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                    Listen to music immediately without creating an account. Full player access, public playlists, and playback.
                  </p>
                </div>
              </div>

              {/* Optional Custom Guest Username */}
              {showGuestOptions ? (
                <div className="space-y-2 pt-1">
                  <label htmlFor="custom-guest-name-input" className="block text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    Pick a Guest Name (Optional):
                  </label>
                  <div className="relative">
                    <AtSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="custom-guest-name-input"
                      type="text"
                      value={customGuestName}
                      onChange={(e) => setCustomGuestName(e.target.value)}
                      placeholder="e.g. musiclover, sonic_listener"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowGuestOptions(true)}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium underline underline-offset-2 transition cursor-pointer"
                >
                  Custom username? (Click here)
                </button>
              )}

              <button
                id="auth-btn-guest"
                type="button"
                disabled={isLoading}
                onClick={handleGuestAuth}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>{loadingProvider === 'guest' ? 'Entering Player...' : 'Enter as Guest Listener'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Supabase Setup Assistant for the Developer */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowSetupGuide(!showSetupGuide)}
              className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition py-1"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Supabase Setup Guide & Best Practices</span>
              </span>
              {showSetupGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSetupGuide && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] space-y-2.5 text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Why Supabase is the #1 choice for We Music:
                </p>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-400">
                  <li><strong className="text-slate-900 dark:text-slate-200">Native Google OAuth:</strong> Seamless 1-click login with any Google account.</li>
                  <li><strong className="text-slate-900 dark:text-slate-200">Instant Guest Support:</strong> Allows guest listeners to listen immediately without sign-up.</li>
                  <li><strong className="text-slate-900 dark:text-slate-200">Cloudflare Compatible:</strong> Client-side SDK (`@supabase/supabase-js`) runs 100% on Cloudflare Pages with zero server latency.</li>
                </ul>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 font-mono text-[10px]">
                  <p className="text-slate-500 dark:text-slate-400">Environment Variables to set:</p>
                  <p className="text-emerald-600 dark:text-emerald-400">VITE_SUPABASE_URL=https://your-project.supabase.co</p>
                  <p className="text-emerald-600 dark:text-emerald-400">VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
                </div>
              </div>
            )}
          </div>

          {/* Active session footer if already logged in */}
          {currentUser && (
            <div className="pt-2 text-center text-[11px] text-slate-500 font-mono">
              Currently signed in as <span className="text-slate-700 dark:text-slate-300 font-semibold">@{currentUser.username}</span> ({currentUser.authProvider})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
