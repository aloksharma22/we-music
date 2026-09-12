import React, { useState } from 'react';
import {
  Layers,
  Database,
  Shield,
  DollarSign,
  Radio,
  Cpu,
  GitBranch,
  FolderTree,
  ListOrdered,
  AlertTriangle,
  Sparkles,
  Lock,
  WifiOff,
  Cloud,
  FileCode,
  Terminal,
  Activity
} from 'lucide-react';
import { TECH_STACK, COST_DATA } from '../../data/architectureData';
import { SchemaVisualizer } from './SchemaVisualizer';
import { RbacSimulator } from './RbacSimulator';
import { CostCalculator } from './CostCalculator';
import { ZeroPennyBlueprint } from './ZeroPennyBlueprint';

export const ArchitectureSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'zero_penny' | 'diagram' | 'techstack' | 'database' | 'rbac' | 'streaming' | 'costs' | 'security' | 'pwa' | 'devops' | 'roadmap'
  >('zero_penny');

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Top Banner */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm transition-colors text-slate-900 dark:text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
                PRODUCTION SPECIFICATION
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">v1.0.0 • Private Community Music System</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Architecture & Implementation Blueprint
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
              Engineered for high-fidelity audio delivery, zero-egress economics, OAuth2 authentication,
              strict multi-role isolation, and offline PWA reliability hosted on Vercel and Cloudflare.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-center shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono">Target Host</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">Vercel Edge</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-center shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono">Audio Storage</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">Cloudflare R2</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pt-4 border-t border-slate-200 dark:border-slate-800/80 scrollbar-none">
          {[
            { id: 'zero_penny', label: '$0 Free Forever Guide (Zero Penny)', icon: Sparkles },
            { id: 'diagram', label: 'Architecture Diagram', icon: Layers },
            { id: 'techstack', label: 'Tech Stack & Justifications', icon: Cpu },
            { id: 'database', label: 'Database Schema & ER', icon: Database },
            { id: 'rbac', label: 'RBAC & Permissions', icon: Shield },
            { id: 'streaming', label: 'Streaming & Ingestion', icon: Radio },
            { id: 'costs', label: 'Cost Model (100-10k Users)', icon: DollarSign },
            { id: 'security', label: 'Security & Auth', icon: Lock },
            { id: 'pwa', label: 'Offline / PWA Engine', icon: WifiOff },
            { id: 'devops', label: 'CI/CD & DevOps', icon: GitBranch },
            { id: 'roadmap', label: 'MVP & Roadmap', icon: ListOrdered },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium shrink-0 transition ${
                  isActive
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 0: ZERO PENNY FREE FOREVER BLUEPRINT */}
      {activeTab === 'zero_penny' && <ZeroPennyBlueprint />}

      {/* TAB 1: ARCHITECTURE DIAGRAM */}
      {activeTab === 'diagram' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors text-slate-900 dark:text-slate-100">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Complete End-to-End System Topology
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Visualizing how web clients, edge routing, OAuth identity providers, database layers, and zero-egress audio object stores interact.
            </p>

            {/* ASCII / Text Architecture Diagram */}
            <pre className="p-4 md:p-6 bg-slate-900 dark:bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
{`+---------------------------------------------------------------------------------------------------------+
|                                    CLIENT TIER (Web Browser / PWA)                                      |
|  [Desktop / Tablet / Mobile Browser] <---> [Service Worker: Audio Cache (IndexedDB) & Cache API]       |
+---------------------------------------------------+-----------------------------------------------------+
                                                    | (HTTPS / TLS 1.3)
                                                    v
+---------------------------------------------------+-----------------------------------------------------+
|                                 EDGE TIER (Vercel Global Edge Network)                                  |
|  * Edge Middleware: JWT Validation / Rate Limiting (Upstash Redis) / Device Detection                   |
|  * Static Assets & Next.js 15 App Router Frontend Cached at Edge PoPs                                    |
+-------------------------+-------------------------------------------------+-----------------------------+
                          |                                                 |
             (API Routes / Server Actions)                        (Signed Audio Requests)
                          v                                                 v
+-------------------------+-------------------------+   +-------------------+-----------------------------+
|          VERCEL SERVERLESS COMPUTE ENGINE         |   |          AUDIO STREAMING & DELIVERY             |
|  * Auth.js v5 (Google OAuth & Apple ID Engine)   |   |  * Cloudflare CDN PoPs                          |
|  * Music Ingestion & Metadata Tag Validator       |   |  * Signed HLS Audio Manifests (.m3u8)          |
|  * Playlist Collaboration & RBAC Gatekeeper       |   |  * Encrypted Audio Segments (.m4s / .ts)        |
|  * PostgreSQL Connection Pool Manager             |   |  * $0 EGRESS Storage: Cloudflare R2             |
+-------------------------+-------------------------+   +-------------------+-----------------------------+
                          |                                                 ^
          (TLS Query via Drizzle ORM)                                       | (Uploads / Transcodes)
                          v                                                 |
+-------------------------+-------------------------+   +-------------------+-----------------------------+
|            PERSISTENCE & STATE TIER               |   |          INGESTION & TRANSCODING PIPELINE       |
|  * PostgreSQL (Supabase / Neon Serverless)        |   |  * Client Direct Upload via Presigned URL       |
|    - Users, OAuth Accounts, RBAC Roles            |   |  * Cloudflare Worker / AWS Batch Transcoder     |
|    - Track Catalog, Waveforms, Playlists          |   |  * Audio Normalization (-14 LUFS standard)      |
|    - pg_trgm GIN Search Index & pgvector          |   |  * Multi-bitrate HLS Segmenter (128/256/320kbps)|
|  * Upstash Redis (Session Revocation / Caching)   |   |  * Waveform Peak Extraction JSON generator      |
+---------------------------------------------------+---+-------------------------------------------------+`}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
                1. Authentication Flow
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Exclusively Google and Apple OAuth. OAuth2 redirect with PKCE, JWT stored in httpOnly, Secure, SameSite=Strict cookies with 15-minute rotation.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
                2. Storage Privacy Rule
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                All uploaded tracks default strictly to private to the uploader. Shared only through explicit playlist collaboration or community pool submission.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
                3. Zero Egress Advantage
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Streaming music creates massive egress bandwidth. Hosting media in Cloudflare R2 eliminates AWS S3's $0.09/GB egress fee completely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECH STACK */}
      {activeTab === 'techstack' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors text-slate-900 dark:text-slate-100">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Complete Technology Stack Selection & Architectural Justifications
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              Every technology chosen strictly prioritizes cost-efficiency, Vercel native synergy, sub-100ms latency, and zero operational overhead.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TECH_STACK.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      {item.layer}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">{item.technology}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{item.justification}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 font-mono">
                    <span>Evaluated Alternatives: </span>
                    <span className="text-slate-600 dark:text-slate-400">{item.alternativesConsidered.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE SCHEMA */}
      {activeTab === 'database' && <SchemaVisualizer />}

      {/* TAB 4: RBAC & PERMISSIONS */}
      {activeTab === 'rbac' && <RbacSimulator />}

      {/* TAB 5: AUDIO STREAMING & INGESTION */}
      {activeTab === 'streaming' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors text-slate-900 dark:text-slate-100">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Audio Ingestion, Validation & Streaming Architecture
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              How raw audio files are securely ingested, sanitized, transcoded into HLS multi-bitrate streams, and delivered to browsers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-mono text-xs flex items-center justify-center mb-3 font-semibold">
                  1
                </span>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Direct-to-R2 Presigned Upload</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Client requests upload ticket with file hash, MIME type (audio/mpeg, audio/flac, audio/aac), and byte size.
                  Vercel Route Handler checks storage quota and returns a short-lived PUT presigned URL. Audio flows directly from client browser to Cloudflare R2, completely bypassing Vercel serverless payload limits.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-mono text-xs flex items-center justify-center mb-3 font-semibold">
                  2
                </span>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">FFmpeg Transcoding & Peak Extraction</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Cloudflare Worker or container worker detects object creation. It extracts ID3 metadata tags, album art image, and generates a 100-point normalized waveform peak JSON array.
                  Normalizes audio loudness to -14 LUFS and encodes into 3 HLS streams: 128 kbps (mobile/low-data), 256 kbps (standard), and 320 kbps (audiophile).
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-mono text-xs flex items-center justify-center mb-3 font-semibold">
                  3
                </span>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Signed HLS Playback Delivery</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  When a community user presses play, the web app requests an ephemeral signed stream token. The worker verifies user RBAC rights and yields an `.m3u8` manifest.
                  Segments are fetched with time-limited HMAC tokens, preventing unauthorized hotlinking or bulk download scrapers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: COSTS */}
      {activeTab === 'costs' && <CostCalculator />}

      {/* TAB 7: SECURITY & AUTH */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors text-slate-900 dark:text-slate-100">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Comprehensive Security & OWASP Hardening Specifications
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              Rigorous defensive architecture engineered for private closed communities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Exclusive OAuth2 Authentication (No Passwords)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sign in with Google and Apple accounts strictly. Eliminates credential stuffing, password breaches, and bcrypt overhead.
                  Session cookies configured with <code>HttpOnly; Secure; SameSite=Strict; Path=/</code> with rolling 15-minute JWT validity and Upstash Redis revocation blacklist.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Anti-Download & Stream Protection
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Direct raw file links are never exposed. Audio is served via encrypted HLS 6-second chunk playlists with signed HMAC expiration tokens.
                  Canvas waveform visualizers inspect Web Audio nodes without providing raw buffer download primitives.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Rate Limiting & Abuse Prevention
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sliding-window rate limiter via Upstash Redis at Vercel Edge:
                  <br />• Audio streaming tokens: 120 requests / minute
                  <br />• File upload initiation: 15 tracks / hour / member
                  <br />• Search queries: 60 requests / minute
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Content Security Policy (CSP) & CORS
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Strict CSP headers prohibiting inline scripts, restricting media-src to Cloudflare R2 bucket domains, and framing policies set to <code>DENY</code> to avoid clickjacking attacks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: PWA & OFFLINE */}
      {activeTab === 'pwa' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors text-slate-900 dark:text-slate-100">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Progressive Web App (PWA) & Offline Storage Architecture
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              Delivering an installable native-like web app on iOS Safari, Android Chrome, and Desktop with offline playback.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Service Worker & Workbox</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Precaches app shell (HTML, CSS, JS bundles). Employs a <code>CacheFirst</code> strategy for static album artwork and <code>NetworkFirst</code> with fallback for playlist metadata.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Encrypted IndexedDB Storage</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Downloaded offline tracks are stored as ArrayBuffers inside client-side IndexedDB using <code>idb-keyval</code>.
                  Each cached track is encrypted with a client device session key to deter extraction.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Background Sync & Telemetry</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Playback history and favorite toggles performed offline are enqueued into an IndexedDB sync queue.
                  When network connectivity restores, Background Sync automatically posts events to <code>/api/sync/playback</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: DEVOPS & CI/CD */}
      {activeTab === 'devops' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors text-slate-900 dark:text-slate-100">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              GitHub Actions CI/CD Pipeline & Vercel Automated Deployment
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              Automated testing, linting, database migrations, and zero-downtime edge previews on every pull request.
            </p>

            <div className="p-4 md:p-6 bg-slate-900 dark:bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto space-y-4">
              <div className="text-emerald-400 font-bold"># .github/workflows/deploy.yml</div>
              <div>
                <span className="text-purple-400">name:</span> Production CI/CD Pipeline
              </div>
              <div>
                <span className="text-purple-400">on:</span>
                <div className="pl-4">
                  push: &#123; branches: [main] &#125;<br />
                  pull_request: &#123; branches: [main] &#125;
                </div>
              </div>
              <div>
                <span className="text-purple-400">jobs:</span>
                <div className="pl-4 space-y-2">
                  <div>
                    <span className="text-blue-400">verify-and-test:</span>
                    <div className="pl-4 text-slate-400">
                      - runs-on: ubuntu-latest<br />
                      - steps:<br />
                      &nbsp;&nbsp;* Checkout repository<br />
                      &nbsp;&nbsp;* Setup Node.js 22 with pnpm cache<br />
                      &nbsp;&nbsp;* Run TypeScript check: <code className="text-amber-300">pnpm tsc --noEmit</code><br />
                      &nbsp;&nbsp;* Run ESLint validation: <code className="text-amber-300">pnpm lint</code><br />
                      &nbsp;&nbsp;* Execute Vitest unit & RBAC policy tests: <code className="text-amber-300">pnpm test</code>
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-400">database-migration:</span>
                    <div className="pl-4 text-slate-400">
                      - needs: verify-and-test<br />
                      - if: github.ref == 'refs/heads/main'<br />
                      - steps:<br />
                      &nbsp;&nbsp;* Drizzle dry-run check against PostgreSQL<br />
                      &nbsp;&nbsp;* Execute safe forward migration: <code className="text-amber-300">pnpm drizzle-kit migrate</code>
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-400">vercel-deploy:</span>
                    <div className="pl-4 text-slate-400">
                      - needs: database-migration<br />
                      - steps:<br />
                      &nbsp;&nbsp;* Trigger Vercel CLI production deployment with GitHub commit SHA tag
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors text-slate-900 dark:text-slate-100">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              MVP Implementation Roadmap & Future Scalability Horizons
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              Phased 8-week MVP launch plan followed by advanced community audio enhancements.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phase 1 MVP */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-emerald-300 dark:border-emerald-500/30 shadow-xs">
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-2">
                  Weeks 1–4: MVP Launch Foundations
                </span>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>Setup Next.js 15, Vercel, and Auth.js with Google & Apple OAuth accounts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>Provision Supabase / Neon PostgreSQL schema with Drizzle ORM and RBAC roles.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>Cloudflare R2 bucket setup with S3 presigned upload URLs & private-by-default rules.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>Core Web Audio player: play, seek, volume, queue, and canvas waveform rendering.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>Basic playlist creation, editing, and personal private music library views.</span>
                  </li>
                </ul>
              </div>

              {/* Phase 2 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block mb-2">
                  Weeks 5–8: Community Collaboration & PWA
                </span>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                    <span>Shared collaborative playlists with Owner, Editor, Contributor, and Viewer roles.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                    <span>Audio crossfade (0–12s), variable playback speeds (0.5x–2.0x), and keyboard shortcuts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                    <span>PWA offline mode with encrypted IndexedDB caching and service worker lifecycle.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                    <span>PostgreSQL full-text search with pg_trgm indices across title, artist, album, and genre.</span>
                  </li>
                </ul>
              </div>

              {/* Future Scalability */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 md:col-span-2 shadow-xs">
                <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block mb-2">
                  Future Horizon: Scalability & Community Enhancements
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
                  <div className="p-3 bg-white dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                    <p className="font-semibold text-slate-900 dark:text-white mb-1">pgvector Music Recommendations</p>
                    <p className="text-slate-500 dark:text-slate-400">Embed acoustic audio features into vector vectors to recommend tracks based on harmonic similarity.</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                    <p className="font-semibold text-slate-900 dark:text-white mb-1">Live Group Listening Rooms</p>
                    <p className="text-slate-500 dark:text-slate-400">Synchronized community listening parties via WebSockets/WebRTC with collaborative queue chat.</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                    <p className="font-semibold text-slate-900 dark:text-white mb-1">Lossless FLAC Master Streaming</p>
                    <p className="text-slate-500 dark:text-slate-400">Optional 24-bit/96kHz bit-perfect audiophile tier with selective caching for high-speed connections.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
