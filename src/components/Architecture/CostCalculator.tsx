import React, { useState } from 'react';
import { DollarSign, Server, HardDrive, Cpu, Zap, ArrowUpRight, Info } from 'lucide-react';
import { COST_DATA } from '../../data/architectureData';

export const CostCalculator: React.FC = () => {
  const [users, setUsers] = useState<number>(1000);
  const [hoursPerDay, setHoursPerDay] = useState<number>(1.5);
  const [bitrateKbps, setBitrateKbps] = useState<number>(256);
  const [tracksPerUser, setTracksPerUser] = useState<number>(150);

  // Bandwidth calculation: (users * hours/day * 30 days * (bitrate / 8) * 3600 sec) / (1024 * 1024) GB
  const monthlyBandwidthGB = Math.round(
    (users * hoursPerDay * 30 * (bitrateKbps / 8) * 3600) / (1024 * 1024)
  );

  // Storage calculation: (users * tracksPerUser * avgTrackSizeMB) / 1024 GB
  // approx size for 3.5 min track: (3.5 * 60 * (bitrateKbps/8)) / 1024 MB
  const avgTrackSizeMB = Math.max(5, (210 * (bitrateKbps / 8)) / 1024);
  const totalStorageGB = Math.round((users * tracksPerUser * avgTrackSizeMB) / 1024);

  // Cost breakdowns:
  // Cloudflare R2: $0.015 / GB-month storage, $0 EGRESS (vs AWS S3 $0.09/GB egress which would be $400+)
  const r2StorageCost = Math.max(0, (totalStorageGB - 10) * 0.015); // first 10GB free
  const s3EquivalentCost = monthlyBandwidthGB * 0.09; // What AWS would have charged for egress

  // Vercel cost: Hobby tier is $0 up to 100GB bandwidth & community use
  let vercelCost = 0;
  if (users > 100) vercelCost = 20; // Pro tier recommended for >100 users
  if (users > 5000) vercelCost = 60;
  if (users > 15000) vercelCost = 120;

  // Supabase / Neon Postgres: 500MB free tier
  let dbCost = 0; // free tier for < 500mb
  if (users >= 500 && users < 3000) dbCost = 25;
  else if (users >= 3000 && users < 10000) dbCost = 85;
  else if (users >= 10000) dbCost = 175;

  // Redis / Upstash: 10k daily commands free
  let redisCost = 0;
  if (users >= 500 && users < 3000) redisCost = 5;
  else if (users >= 3000) redisCost = 30;

  // Transcoding: $0 for small community via Client-Side Web Audio / WASM worker
  const transcodingCost = users <= 100 ? 0 : Math.max(2, Math.round(users * 0.015));

  const totalMonthlyCost = vercelCost + r2StorageCost + dbCost + redisCost + transcodingCost;
  const isFreeTier = totalMonthlyCost === 0;
  const costPerUser = isFreeTier ? '0.000' : (totalMonthlyCost / users).toFixed(3);

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors text-slate-900 dark:text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
            <DollarSign className="w-5 h-5" />
            <span className="text-base text-slate-900 dark:text-slate-100">Interactive Community Infrastructure Cost Model</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Real-time projection showing how Cloudflare R2's zero-egress policy slashes 85-92% of streaming expenses.
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { count: 25, label: '25 ($0 Free Tier)' },
            { count: 100, label: '100 Users' },
            { count: 1000, label: '1,000 Users' },
            { count: 10000, label: '10,000 Users' }
          ].map((preset) => (
            <button
              key={preset.count}
              type="button"
              onClick={() => {
                setUsers(preset.count);
                if (preset.count === 25) {
                  setTracksPerUser(50); // Keeps it under 10GB free tier
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                users === preset.count
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zero Penny Free-Tier Active Alert */}
      {isFreeTier && (
        <div className="my-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 rounded-xl flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-mono">
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Zero-Penny Tier Active: 100% of workload fits inside permanent Free Tier quotas.</span>
          </div>
          <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">$0.00 Billed</span>
        </div>
      )}

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-b border-slate-200 dark:border-slate-800">
        {/* Users */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Community Members</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{users.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="10"
            max="15000"
            step="10"
            value={users}
            onChange={(e) => setUsers(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
          />
        </div>

        {/* Hours / Day */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Avg. Listening Hours/Day</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{hoursPerDay} hrs</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="6"
            step="0.5"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
          />
        </div>

        {/* Bitrate */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Stream Bitrate</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{bitrateKbps} kbps</span>
          </div>
          <select
            value={bitrateKbps}
            onChange={(e) => setBitrateKbps(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
          >
            <option value="128">128 kbps (AAC Mobile)</option>
            <option value="256">256 kbps (AAC High Quality)</option>
            <option value="320">320 kbps (MP3 / High Def)</option>
            <option value="800">800 kbps (Lossless FLAC)</option>
          </select>
        </div>

        {/* Tracks per user */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Stored Tracks / User</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{tracksPerUser}</span>
          </div>
          <input
            type="range"
            min="20"
            max="400"
            step="10"
            value={tracksPerUser}
            onChange={(e) => setTracksPerUser(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
          />
        </div>
      </div>

      {/* Real-time metrics banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Monthly Streaming Egress</span>
          <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
            {monthlyBandwidthGB >= 1000
              ? `${(monthlyBandwidthGB / 1024).toFixed(1)} TB`
              : `${monthlyBandwidthGB} GB`}
          </p>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">0 Egress fees with R2</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Total Audio Storage</span>
          <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
            {totalStorageGB >= 1000
              ? `${(totalStorageGB / 1024).toFixed(1)} TB`
              : `${totalStorageGB} GB`}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            {(users * tracksPerUser).toLocaleString()} total tracks
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Estimated Total Cost</span>
          <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            ${totalMonthlyCost.toFixed(2)}
            <span className="text-xs text-slate-500 font-normal"> / mo</span>
          </p>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400/90 font-mono">
            ${costPerUser} / user / month
          </span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 shadow-xs">
          <span className="text-xs text-emerald-800 dark:text-emerald-300 block mb-1 font-medium">Cloudflare R2 Savings</span>
          <p className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
            +${Math.round(s3EquivalentCost).toLocaleString()} / mo
          </p>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">Saved vs AWS S3 egress</span>
        </div>
      </div>

      {/* Cost Table Breakdown */}
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <th className="py-2.5 px-3">Service</th>
              <th className="py-2.5 px-3">Purpose & Specification</th>
              <th className="py-2.5 px-3 font-mono text-right">Estimated Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
            <tr>
              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-200">
                {vercelCost === 0 ? 'Vercel (Hobby Free Tier)' : 'Vercel (Pro Plan)'}
              </td>
              <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                {vercelCost === 0
                  ? 'Edge Middleware, Next.js Serverless APIs, 100 GB Fast Data Transfer (Bandwidth)'
                  : 'Edge Middleware, Next.js Route Handlers, SSL, higher concurrency & team workflows'}
              </td>
              <td className={`py-2.5 px-3 text-right font-bold ${vercelCost === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'}`}>
                ${vercelCost}.00 / mo
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-200">
                {r2StorageCost === 0 ? 'Cloudflare R2 (10 GB Free Tier)' : 'Cloudflare R2'}
              </td>
              <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                Encrypted audio object storage ({totalStorageGB} GB) with $0 egress bandwidth
              </td>
              <td className={`py-2.5 px-3 text-right font-bold ${r2StorageCost === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'}`}>
                ${r2StorageCost.toFixed(2)} / mo
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-200">
                {dbCost === 0 ? 'PostgreSQL (Supabase 500MB Free Tier)' : 'PostgreSQL (Supabase Pro / Neon)'}
              </td>
              <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                Relational DB, OAuth sessions, track metadata, RLS, full-text search
              </td>
              <td className={`py-2.5 px-3 text-right font-bold ${dbCost === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'}`}>
                ${dbCost}.00 / mo
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-200">
                {redisCost === 0 ? 'Upstash Redis (10k cmd/day Free)' : 'Upstash Serverless Redis'}
              </td>
              <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                Rate limiting, session revocation, play state caching, active token validation
              </td>
              <td className={`py-2.5 px-3 text-right font-bold ${redisCost === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'}`}>
                ${redisCost}.00 / mo
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-200">
                {transcodingCost === 0 ? 'Audio Processing (Client Web Audio / WASM)' : 'FFmpeg Transcoder Worker'}
              </td>
              <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                {transcodingCost === 0
                  ? 'Client-side peak waveform extraction and loudness normalization ($0 server compute)'
                  : 'Automated ingestion validation, normalization, and HLS multi-bitrate segmenting'}
              </td>
              <td className={`py-2.5 px-3 text-right font-bold ${transcodingCost === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'}`}>
                ${transcodingCost}.00 / mo
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
