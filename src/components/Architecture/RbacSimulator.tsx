import React, { useState } from 'react';
import { Shield, CheckCircle2, XCircle, AlertCircle, Users, Key } from 'lucide-react';
import { UserRole, PlaylistAccessRole } from '../../types';

interface ActionItem {
  id: string;
  name: string;
  description: string;
  category: 'Community Level' | 'Playlist Level' | 'Audio Storage & Files';
  check: (userRole: UserRole, playlistRole?: PlaylistAccessRole, isItemOwner?: boolean) => {
    allowed: boolean;
    reason: string;
  };
}

const ACTIONS: ActionItem[] = [
  {
    id: 'stream_audio',
    name: 'Stream Community Tracks',
    description: 'Listen to public/community tracks with signed HLS tokens',
    category: 'Community Level',
    check: () => ({
      allowed: true,
      reason: 'All authenticated community members possess streaming privileges.',
    }),
  },
  {
    id: 'upload_music',
    name: 'Upload Music (Private by Default)',
    description: 'Ingest audio files into private R2 storage bucket',
    category: 'Audio Storage & Files',
    check: () => ({
      allowed: true,
      reason: 'All members can upload; tracks default strictly to private visibility.',
    }),
  },
  {
    id: 'publish_community',
    name: 'Publish Track to Community Pool',
    description: 'Promote a private track to be globally streamable',
    category: 'Community Level',
    check: (userRole) => {
      if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
        return { allowed: true, reason: `${userRole} has community catalog publishing authority.` };
      }
      return { allowed: false, reason: 'Members must submit tracks for moderation or share via playlists.' };
    },
  },
  {
    id: 'edit_metadata',
    name: 'Edit Track Metadata & Artwork',
    description: 'Modify title, artist, genre, release year, or album art',
    category: 'Audio Storage & Files',
    check: (userRole, _, isItemOwner) => {
      if (userRole === 'ADMIN') return { allowed: true, reason: 'Admins hold universal edit rights.' };
      if (isItemOwner) return { allowed: true, reason: 'The original uploader owns their track metadata.' };
      return { allowed: false, reason: 'Users cannot edit tracks uploaded by other members.' };
    },
  },
  {
    id: 'delete_track',
    name: 'Delete Audio File',
    description: 'Purge file from Cloudflare R2 and delete database record',
    category: 'Audio Storage & Files',
    check: (userRole, _, isItemOwner) => {
      if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
        return { allowed: true, reason: `${userRole} can delete infringing content from platform.` };
      }
      if (isItemOwner) return { allowed: true, reason: 'Uploader has full deletion rights on own files.' };
      return { allowed: false, reason: 'Cannot delete files uploaded by others.' };
    },
  },
  {
    id: 'download_original',
    name: 'Download Original Master File (WAV/FLAC)',
    description: 'Export raw source file instead of streamed HLS chunks',
    category: 'Audio Storage & Files',
    check: (userRole, _, isItemOwner) => {
      if (userRole === 'ADMIN') return { allowed: true, reason: 'Admins have master archive download access.' };
      if (isItemOwner) return { allowed: true, reason: 'Uploaders can always download their original master files.' };
      return { allowed: false, reason: 'Community members can only stream encoded HLS, preventing direct ripping.' };
    },
  },
  {
    id: 'add_playlist_track',
    name: 'Add Track to Collaborative Playlist',
    description: 'Append song to a shared community playlist',
    category: 'Playlist Level',
    check: (_, playlistRole) => {
      if (playlistRole === 'OWNER' || playlistRole === 'EDITOR' || playlistRole === 'CONTRIBUTOR') {
        return { allowed: true, reason: `${playlistRole} permission grants adding songs to playlist.` };
      }
      return { allowed: false, reason: 'VIEWER role on a playlist is strictly read-only.' };
    },
  },
  {
    id: 'reorder_playlist',
    name: 'Reorder / Remove Any Playlist Tracks',
    description: 'Re-sequence tracks or remove songs added by other members',
    category: 'Playlist Level',
    check: (_, playlistRole) => {
      if (playlistRole === 'OWNER' || playlistRole === 'EDITOR') {
        return { allowed: true, reason: `${playlistRole} has full track curation control.` };
      }
      return { allowed: false, reason: 'Contributors can only remove tracks they personally submitted.' };
    },
  },
  {
    id: 'manage_playlist_members',
    name: 'Manage Playlist Sharing & Collaborators',
    description: 'Invite members and assign Owner/Editor/Contributor/Viewer roles',
    category: 'Playlist Level',
    check: (_, playlistRole) => {
      if (playlistRole === 'OWNER') {
        return { allowed: true, reason: 'Playlist Owner holds exclusive sharing and role delegation rights.' };
      }
      return { allowed: false, reason: 'Only the Playlist Owner can alter collaborator permissions.' };
    },
  },
  {
    id: 'view_audit_logs',
    name: 'View Security Audit Logs & Telemetry',
    description: 'Inspect user logins, OAuth linkings, and file purge histories',
    category: 'Community Level',
    check: (userRole) => {
      if (userRole === 'ADMIN') return { allowed: true, reason: 'Admins hold platform audit inspection clearance.' };
      return { allowed: false, reason: 'Restricted to platform administrators under OWASP guidelines.' };
    },
  },
];

export const RbacSimulator: React.FC = () => {
  const [selectedUserRole, setSelectedUserRole] = useState<UserRole>('MEMBER');
  const [selectedPlaylistRole, setSelectedPlaylistRole] = useState<PlaylistAccessRole>('CONTRIBUTOR');
  const [isItemOwner, setIsItemOwner] = useState<boolean>(false);

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors text-slate-900 dark:text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-base text-slate-900 dark:text-slate-100">Interactive RBAC & Collaboration Permission Engine</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Simulate real-time PostgreSQL Row-Level Security (RLS) and API authorization policies.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* User Role Selector */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 flex items-center gap-1 text-xs shadow-xs">
            <span className="text-slate-500 font-mono px-1 font-medium">User:</span>
            {(['MEMBER', 'MODERATOR', 'ADMIN'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedUserRole(r)}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  selectedUserRole === r
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Playlist Role Selector */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 flex items-center gap-1 text-xs shadow-xs">
            <span className="text-slate-500 font-mono px-1 font-medium">Playlist:</span>
            {(['VIEWER', 'CONTRIBUTOR', 'EDITOR', 'OWNER'] as PlaylistAccessRole[]).map((pr) => (
              <button
                key={pr}
                type="button"
                onClick={() => setSelectedPlaylistRole(pr)}
                className={`px-2 py-1 rounded font-medium transition ${
                  selectedPlaylistRole === pr
                    ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {pr}
              </button>
            ))}
          </div>

          {/* Owner checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition select-none shadow-xs">
            <input
              type="checkbox"
              checked={isItemOwner}
              onChange={(e) => setIsItemOwner(e.target.checked)}
              className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500/20"
            />
            <span className="font-medium">Is Track Owner</span>
          </label>
        </div>
      </div>

      {/* Permissions Test Table */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {ACTIONS.map((action) => {
          const res = action.check(selectedUserRole, selectedPlaylistRole, isItemOwner);
          return (
            <div
              key={action.id}
              className={`p-3.5 rounded-lg border flex items-start gap-3 transition ${
                res.allowed
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30'
                  : 'bg-slate-50/80 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 opacity-85 dark:opacity-75'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {res.allowed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{action.name}</p>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                      res.allowed
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {res.allowed ? 'PERMITTED' : 'DENIED'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1.5">{action.description}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-950/60 p-1.5 rounded border border-slate-200 dark:border-slate-800/60 shadow-xs">
                  {res.reason}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
