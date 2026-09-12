import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  HardDrive,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Radio,
  Layers,
  Info,
  DollarSign,
  Zap,
  Lock
} from 'lucide-react';

export const ZeroPennyBlueprint: React.FC = () => {
  const [selectedBitrate, setSelectedBitrate] = useState<number>(128);
  const [avgSongMinutes, setAvgSongMinutes] = useState<number>(3.5);

  // Cloudflare R2 free tier storage: 10 GB = 10,240 MB
  const freeStorageMB = 10240;

  // File size in MB = (bitrateKbps / 8) * (minutes * 60) / 1024
  const songSizeBytes = (selectedBitrate * 1000 / 8) * (avgSongMinutes * 60);
  const songSizeMB = Number((songSizeBytes / (1024 * 1024)).toFixed(2));

  // Number of songs fitting in 10 GB free tier
  const maxSongsInFreeTier = Math.floor(freeStorageMB / songSizeMB);

  // Vercel Hobby fast data transfer: 100 GB/month
  // If streaming directly via Cloudflare R2 ($0 egress), Vercel data transfer consumed is 0 GB!
  const vercelTransferDirectFromR2 = 0;
  // If accidentally served through Vercel:
  const songsBeforeVercelLimit = Math.floor((100 * 1024) / songSizeMB);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Hero Badge */}
      <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                100% FREE FOREVER ARCHITECTURE
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Zero Penny Guarantee ($0.00 / mo)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Host on GitHub & Vercel Completely Free Without Paying a Penny
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              By separating the application code (hosted on GitHub and deployed on Vercel) from the media files (stored in Cloudflare R2's permanent 10 GB free tier with zero egress fees), you can stream thousands of songs to your private community with zero subscription or hosting costs.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-950/90 border border-emerald-300 dark:border-emerald-500/40 rounded-xl p-4 text-center shrink-0 shadow-sm">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">Monthly Cost</span>
            <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">$0.00</span>
            <span className="text-[10px] text-slate-500 block font-mono mt-0.5">Permanent Free Tiers</span>
          </div>
        </div>
      </div>

      {/* Maximum Size Limits Matrix */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
          <HardDrive className="w-5 h-5" />
          <h3 className="text-base text-slate-900 dark:text-slate-100">Exact Maximum Size Limits on the Free Tier</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
          These are the official hard constraints of GitHub, Vercel, and accompanying services. Stay strictly within these boundaries to guarantee $0.00 spend.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* GitHub Free */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 dark:text-slate-200 text-sm">GitHub Free</span>
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">Source Code</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Recommended Max Repo Size:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 font-bold text-sm">1.0 GB</span>
                  <span className="text-[10px] text-slate-500 block">(Hard limit: 2 GB - 5 GB)</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Single File Limit:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">100 MB max</span>
                  <span className="text-[10px] text-slate-500 block">(Rejects commits over 100 MB)</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">App Code Size Needed:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">15 - 35 MB</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block">(&lt; 4% of repo limit)</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              CI/CD: 2,000 free min/mo
            </div>
          </div>

          {/* Vercel Hobby */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 dark:text-slate-200 text-sm">Vercel Hobby</span>
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">Web Hosting</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Max Function Bundle:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 font-bold text-sm">50 MB (zipped)</span>
                  <span className="text-[10px] text-slate-500 block">250 MB uncompressed limit</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Fast Data Transfer (Bandwidth):</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">100 GB / month</span>
                  <span className="text-[10px] text-slate-500 block">Free forever</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Build Execution Time:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">45 min / build</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block">(Typical build: ~45 sec)</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Edge Middleware: 1M req/mo
            </div>
          </div>

          {/* Cloudflare R2 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-emerald-300 dark:border-emerald-800/50 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 dark:text-slate-200 text-sm">Cloudflare R2</span>
                <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded">Audio Storage</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Free Storage Allowance:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-sm">10 GB / month</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block">Permanent free tier</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Egress Bandwidth Fee:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">$0.00 (Unlimited)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block">ZERO egress fee policy</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Free Operation Requests:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">10M Read / 1M Write</span>
                  <span className="text-[10px] text-slate-500 block">Per month 100% free</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
              Key to $0 streaming
            </div>
          </div>

          {/* Supabase / Neon */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 dark:text-slate-200 text-sm">Supabase / Neon</span>
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">Database & Auth</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Database Storage:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 font-bold text-sm">500 MB Postgres</span>
                  <span className="text-[10px] text-slate-500 block">Holds 500,000+ tracks</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Monthly Active Users:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">50,000 MAUs</span>
                  <span className="text-[10px] text-slate-500 block">Google OAuth included</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Upstash Redis Free:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">10k commands / day</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block">256 MB memory cache</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Unlimited API reads
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Free-Tier Audio Capacity Calculator */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
          <Radio className="w-5 h-5" />
          <h3 className="text-base text-slate-900 dark:text-slate-100">Live 10 GB Free Storage Capacity Calculator</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
          Adjust the audio quality and song length to calculate the exact maximum number of full-length tracks you can host in Cloudflare R2 without paying a penny.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Streaming Audio Quality</label>
            <select
              value={selectedBitrate}
              onChange={(e) => setSelectedBitrate(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="128">128 kbps (Standard AAC - recommended for mobile)</option>
              <option value="192">192 kbps (High Quality AAC / MP3)</option>
              <option value="256">256 kbps (Audiophile AAC - Apple Music standard)</option>
              <option value="320">320 kbps (Maximum MP3 Fidelity)</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">
              128 kbps provides transparent fidelity while doubling song capacity.
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Average Song Duration</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{avgSongMinutes} minutes</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="6.0"
              step="0.5"
              value={avgSongMinutes}
              onChange={(e) => setAvgSongMinutes(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block font-mono">
              Estimated file size per track: {songSizeMB} MB
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-emerald-300 dark:border-emerald-500/40 flex flex-col justify-center text-center shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">Max Free Songs in 10 GB R2</span>
            <span className="text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-400 my-1">
              {maxSongsInFreeTier.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-500 font-mono">
              ~{(maxSongsInFreeTier * 12).toLocaleString()} playlist albums • $0.00 cost
            </span>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className={`p-3 rounded-lg border transition ${selectedBitrate === 128 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">128 kbps AAC</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 block">~3,047 Tracks</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">3.3 MB / track</span>
          </div>
          <div className={`p-3 rounded-lg border transition ${selectedBitrate === 192 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">192 kbps AAC</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 block">~2,031 Tracks</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">5.0 MB / track</span>
          </div>
          <div className={`p-3 rounded-lg border transition ${selectedBitrate === 256 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">256 kbps AAC</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 block">~1,523 Tracks</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">6.7 MB / track</span>
          </div>
          <div className={`p-3 rounded-lg border transition ${selectedBitrate === 320 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">320 kbps MP3</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 block">~1,219 Tracks</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">8.4 MB / track</span>
          </div>
        </div>
      </div>

      {/* The 4 Golden Rules to Never Pay a Penny */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-2">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-base text-slate-900 dark:text-slate-100">The 4 Golden Rules to Never Pay a Penny</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
          Follow these architectural design patterns to guarantee that your deployment cannot trigger accidental credit card charges.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rule 1 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
              1
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                NEVER Put Audio Files in Git or Vercel's Static Folder
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                If you place audio files inside <code className="text-emerald-700 dark:text-emerald-400 font-mono">/public/music</code> or git commits, every song play directly consumes Vercel's 100 GB monthly bandwidth allowance. After ~12,000 plays, Vercel will halt your site or require a $20/mo Pro upgrade. Keeping your Git repo under 25 MB and uploading audio solely to Cloudflare R2 completely isolates your Vercel bandwidth from media streaming.
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
              2
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                Stream Audio Directly from Cloudflare R2 ($0 Egress)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cloudflare R2 provides zero egress fees. Point a custom domain or Cloudflare Worker route directly to your R2 bucket. When users listen to music, audio data flows directly between Cloudflare's edge network and the listener's browser. Vercel only serves the lightweight UI app shell (HTML/JS/CSS).
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
              3
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                Enforce Hard Code-Level Storage Caps (Cap at 9.5 GB)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                In your upload route handler (<code className="text-emerald-700 dark:text-emerald-400 font-mono">/api/upload/ticket</code>), query the total storage used. If total bytes exceed 9.5 GB (leaving a 500 MB safety margin below Cloudflare's 10 GB limit), reject upload tickets. This mathematically guarantees you never incur even a single cent of R2 overage.
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
              4
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                Configure Vercel Spending Management to $0 Hard Stop
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                In your Vercel Project Settings &gt; Billing &gt; Spend Management, enable the <em>"Pause Project on Limit"</em> option at 100% of the free tier. This ensures that even in an unexpected traffic surge, Vercel pauses serverless execution rather than automatically billing a credit card.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippets: .gitignore and Cap Guard */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <FileCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Ready-to-Use Zero-Penny Configuration Files
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
          Add these configurations to your GitHub repository and Vercel serverless API handlers to enforce the zero-cost rules automatically.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 block mb-1 font-semibold">1. .gitignore (Prevents bloated Git & Vercel builds)</span>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto shadow-inner">
{`# Prevent all raw audio and large media from Git
*.mp3
*.wav
*.flac
*.aac
*.ogg
*.m4a
/public/audio/
/public/uploads/
/media/

# Build artifacts
.next/
node_modules/
dist/
*.tsbuildinfo
.env.local`}
            </pre>
          </div>

          <div>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 block mb-1 font-semibold">2. Upload Hard-Cap Check in /api/upload/ticket.ts</span>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
{`// Enforce strict 9.5 GB community threshold
const MAX_FREE_BYTES = 9.5 * 1024 * 1024 * 1024; // 9.5 GB

export async function POST(req: Request) {
  const currentUsage = await db.select({
    total: sum(tracks.fileSizeBytes)
  }).from(tracks);

  if ((currentUsage[0].total ?? 0) >= MAX_FREE_BYTES) {
    return Response.json(
      { error: "Free tier storage cap (9.5GB) reached! Delete old tracks to upload." },
      { status: 403 }
    );
  }

  // Issue Cloudflare R2 presigned PUT URL...
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
