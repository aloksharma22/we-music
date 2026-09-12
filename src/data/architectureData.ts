export interface TechStackItem {
  layer: string;
  technology: string;
  alternativesConsidered: string[];
  justification: string;
}

export const TECH_STACK: TechStackItem[] = [
  {
    layer: 'Frontend Framework & App Engine',
    technology: 'Next.js 15 (React 19 App Router) on Vercel',
    alternativesConsidered: ['Vite SPA', 'Remix/React Router 7', 'SvelteKit'],
    justification: 'Vercel-native optimization, Edge Middleware for instant auth gatekeeping, server components for fast initial load, automated routing, and best-in-class image optimization for album art.',
  },
  {
    layer: 'Backend Architecture',
    technology: 'Next.js Route Handlers + Edge Middleware + Server Actions',
    alternativesConsidered: ['Separate Express/NestJS backend', 'Go/Rust microservices', 'FastAPI'],
    justification: 'Unified TypeScript repository with zero DevOps maintenance on Vercel. Serverless scale-to-zero keeps idle costs strictly at $0, with Edge Middleware verifying JWTs in <5ms before reaching routes.',
  },
  {
    layer: 'Authentication Provider',
    technology: 'Auth.js v5 (NextAuth) / Clerk / Supabase Auth',
    alternativesConsidered: ['Firebase Auth', 'Custom OAuth2 client', 'Auth0'],
    justification: 'Direct native integration for Google OAuth and Apple Sign-In exclusively, standardizing user claims without storing passwords, with automated token refreshing and multi-session revocation.',
  },
  {
    layer: 'Database & Relational Model',
    technology: 'PostgreSQL on Supabase or Neon Serverless Postgres',
    alternativesConsidered: ['MongoDB', 'DynamoDB', 'CockroachDB', 'Cloud SQL'],
    justification: 'Rich relational integrity for RBAC, nested playlist collaboration, foreign keys, row-level security (RLS), and pgvector support for future music similarity recommendations.',
  },
  {
    layer: 'ORM & Query Builder',
    technology: 'Drizzle ORM (or Prisma)',
    alternativesConsidered: ['TypeORM', 'Raw SQL / Knex', 'Kysely'],
    justification: 'Lightweight zero-overhead TypeScript types, SQL-like execution with zero cold-start latency on serverless edge functions, and automatic schema migrations.',
  },
  {
    layer: 'Object Storage & Media Delivery',
    technology: 'Cloudflare R2 (S3-compatible, zero egress fees)',
    alternativesConsidered: ['AWS S3', 'Google Cloud Storage', 'Vercel Blob'],
    justification: 'Zero egress fees make audio streaming 90% cheaper than AWS S3. Supports S3 API, time-limited presigned URLs, and native integration with Cloudflare Workers for audio chunking/protection.',
  },
  {
    layer: 'Audio Streaming & Transcoding',
    technology: 'HLS (HTTP Live Streaming) + Web Audio API + Cloudflare Stream / FFmpeg Worker',
    alternativesConsidered: ['Direct file MP3 download stream', 'Icecast / Shoutcast', 'DASH only'],
    justification: 'HLS breaks audio into 6-second `.ts` or `.m4s` segments with an `.m3u8` master playlist. Prevents full-file scraping, enables seamless multi-bitrate adaptive streaming, and optimizes buffering on mobile.',
  },
  {
    layer: 'Search Engine',
    technology: 'PostgreSQL Full-Text Search (tsvector + pg_trgm) or Meilisearch',
    alternativesConsidered: ['Elasticsearch', 'Algolia', 'Typesense'],
    justification: 'PostgreSQL with `pg_trgm` and GIN index handles typo-tolerant instant searching across titles, artists, and albums for 50,000+ tracks with zero added operational cost.',
  },
  {
    layer: 'State Management & Offline Storage',
    technology: 'Zustand + TanStack Query + IndexedDB (idb-keyval) + Service Worker',
    alternativesConsidered: ['Redux Toolkit', 'Jotai', 'MobX'],
    justification: 'Zustand provides a lightweight, unopinionated player state (queue, playback, volume) accessible outside React tree. IndexedDB stores encrypted offline audio chunks and metadata.',
  },
  {
    layer: 'UI Styling & Component System',
    technology: 'Tailwind CSS v4 + Motion + Radix UI Primitives',
    alternativesConsidered: ['Material UI', 'Chakra UI', 'Styled Components'],
    justification: 'Tailwind provides zero-runtime CSS bundle, high-contrast accessible themes, and instant customization. Motion delivers hardware-accelerated 60fps player dock and fullscreen transitions.',
  },
  {
    layer: 'Monitoring, Logs & Error Tracking',
    technology: 'Sentry (Client + Serverless) + Vercel Analytics / Speed Insights + Datadog / BetterStack',
    alternativesConsidered: ['LogRocket', 'New Relic', 'CloudWatch'],
    justification: 'Tracks Web Audio playback buffering stalls, audio decode errors, hydration mismatches, and edge route latency with distributed tracing.',
  },
];

export const COST_DATA = [
  {
    tier: '100 Active Users',
    storage: '250 GB audio (~25,000 tracks)',
    streamingBandwidth: '450 GB / month (1.5 hrs/user/day @ 256kbps)',
    vercelCost: '$20 / mo (Pro Plan)',
    storageCost: '$3.75 / mo (Cloudflare R2: $0.015/GB, $0 egress)',
    databaseCost: '$0 / mo (Supabase / Neon free tier)',
    redisAuthCost: '$0 / mo (Upstash free tier)',
    transcodingCost: '$2.50 / mo (initial batch processing)',
    totalMonthly: '$26.25 / mo',
    costPerUser: '$0.26 / user / mo',
  },
  {
    tier: '1,000 Active Users',
    storage: '1.5 TB audio (~150,000 tracks)',
    streamingBandwidth: '4.5 TB / month (1.5 hrs/user/day @ 256kbps)',
    vercelCost: '$20 / mo (Pro Plan base + minimal edge usage)',
    storageCost: '$22.50 / mo (Cloudflare R2, $0 egress)',
    databaseCost: '$25 / mo (Supabase Pro or Neon Scale)',
    redisAuthCost: '$5 / mo (Upstash serverless Redis for active sessions)',
    transcodingCost: '$15 / mo (FFmpeg background transcode queue)',
    totalMonthly: '$87.50 / mo',
    costPerUser: '$0.087 / user / mo',
  },
  {
    tier: '10,000 Active Users',
    storage: '12 TB audio (~1,200,000 tracks)',
    streamingBandwidth: '45 TB / month (1.5 hrs/user/day @ 256kbps)',
    vercelCost: '$60 / mo (Pro Plan + fast data transfer & invocations)',
    storageCost: '$180 / mo (Cloudflare R2: 12TB @ $0.015/GB, $0 egress)',
    databaseCost: '$85 / mo (Dedicated PostgreSQL pool + read replicas)',
    redisAuthCost: '$30 / mo (Upstash Redis cluster for rate limiting)',
    transcodingCost: '$75 / mo (Cloudflare Workers / AWS Batch spot instances)',
    totalMonthly: '$430.00 / mo',
    costPerUser: '$0.043 / user / mo',
  },
];

export const RBAC_MATRIX = [
  { action: 'Browse & Stream Community Tracks', admin: true, moderator: true, member: true, note: 'Default access for all authenticated community members' },
  { action: 'Upload Personal Music (Private by Default)', admin: true, moderator: true, member: true, note: 'Strictly private until user chooses to share or publish' },
  { action: 'Publish Track to Community Pool', admin: true, moderator: true, member: false, note: 'Members can request publication or submit to moderated playlists' },
  { action: 'Edit Track Metadata & Replace Artwork', admin: true, moderator: true, member: 'Owner Only', note: 'Members can only edit their own uploaded tracks' },
  { action: 'Delete Tracks from Platform', admin: true, moderator: true, member: 'Owner Only', note: 'Admins & Moderators can delete infringing content' },
  { action: 'Create & Manage Private Playlists', admin: true, moderator: true, member: true, note: 'Unlimited personal playlists' },
  { action: 'Collaborative Playlist Editing', admin: true, moderator: true, member: 'If Invited (Contributor/Editor)', note: 'Granular permissions per shared playlist' },
  { action: 'Cache Tracks for Offline PWA Playback', admin: true, moderator: true, member: true, note: 'Encrypted chunks in client IndexedDB' },
  { action: 'Download Raw Audio Master File', admin: true, moderator: 'If Permitted', member: 'Owner Only', note: 'Members can export their original master; others stream only' },
  { action: 'Invite/Remove Community Members', admin: true, moderator: 'Flag Only', member: false, note: 'Invite-only gatekeeping for private community' },
  { action: 'Access Audit Logs & Security Telemetry', admin: true, moderator: false, member: false, note: 'Tamper-evident logs of all auth, upload, and sharing actions' },
];

export const PLAYLIST_ROLES = [
  { role: 'OWNER', canView: true, canPlay: true, canAddTrack: true, canRemoveAnyTrack: true, canEditDetails: true, canManageAccess: true, canDeletePlaylist: true },
  { role: 'EDITOR', canView: true, canPlay: true, canAddTrack: true, canRemoveAnyTrack: true, canEditDetails: true, canManageAccess: false, canDeletePlaylist: false },
  { role: 'CONTRIBUTOR', canView: true, canPlay: true, canAddTrack: true, canRemoveAnyTrack: false, canEditDetails: false, canManageAccess: false, canDeletePlaylist: false, note: 'Can only remove tracks they personally added' },
  { role: 'VIEWER', canView: true, canPlay: true, canAddTrack: false, canRemoveAnyTrack: false, canEditDetails: false, canManageAccess: false, canDeletePlaylist: false, note: 'Read-only listener' },
];

export const DATABASE_SCHEMA_TABLES = [
  {
    name: 'users',
    description: 'Core user entity storing OAuth provider IDs and community membership status.',
    columns: [
      { name: 'id', type: 'UUID', pk: true, notes: 'Primary Key, default gen_random_uuid()' },
      { name: 'name', type: 'VARCHAR(255)', pk: false, notes: 'User full display name' },
      { name: 'email', type: 'VARCHAR(255) UNIQUE', pk: false, notes: 'Verified email from Google/Apple' },
      { name: 'avatar_url', type: 'TEXT', pk: false, notes: 'Profile image link' },
      { name: 'role', type: 'user_role_enum', pk: false, notes: 'ADMIN, MODERATOR, or MEMBER' },
      { name: 'status', type: 'user_status_enum', pk: false, notes: 'ACTIVE, SUSPENDED, PENDING_INVITE' },
      { name: 'storage_quota_bytes', type: 'BIGINT', pk: false, notes: 'Default 25GB, configurable by Admin' },
      { name: 'storage_used_bytes', type: 'BIGINT', pk: false, notes: 'Tracked atomic size sum' },
      { name: 'created_at', type: 'TIMESTAMPTZ', pk: false, notes: 'Registration timestamp' },
      { name: 'last_active_at', type: 'TIMESTAMPTZ', pk: false, notes: 'Last heartbeat' },
    ],
  },
  {
    name: 'oauth_accounts',
    description: 'OAuth account linkages supporting Google and Apple with secure token vaults.',
    columns: [
      { name: 'id', type: 'UUID', pk: true, notes: 'Primary Key' },
      { name: 'user_id', type: 'UUID FK -> users.id', pk: false, notes: 'ON DELETE CASCADE' },
      { name: 'provider', type: 'VARCHAR(50)', pk: false, notes: '"google" or "apple"' },
      { name: 'provider_account_id', type: 'VARCHAR(255)', pk: false, notes: 'Sub claim from provider token' },
      { name: 'created_at', type: 'TIMESTAMPTZ', pk: false, notes: 'Link time' },
    ],
  },
  {
    name: 'tracks',
    description: 'Master music entity storing metadata, ownership, audio properties, and waveform data.',
    columns: [
      { name: 'id', type: 'UUID', pk: true, notes: 'Primary Key' },
      { name: 'uploader_id', type: 'UUID FK -> users.id', pk: false, notes: 'Uploader/Owner' },
      { name: 'title', type: 'VARCHAR(255)', pk: false, notes: 'Track title (indexed with pg_trgm)' },
      { name: 'artist', type: 'VARCHAR(255)', pk: false, notes: 'Artist name (indexed with pg_trgm)' },
      { name: 'album', type: 'VARCHAR(255)', pk: false, notes: 'Album title' },
      { name: 'genre', type: 'VARCHAR(100)', pk: false, notes: 'Genre tag' },
      { name: 'duration_seconds', type: 'INT', pk: false, notes: 'Exact duration in seconds' },
      { name: 'release_year', type: 'SMALLINT', pk: false, notes: 'e.g. 2025' },
      { name: 'cover_art_url', type: 'TEXT', pk: false, notes: 'Optimized image CDN URL' },
      { name: 'is_private', type: 'BOOLEAN', pk: false, notes: 'Default TRUE (uploader private only)' },
      { name: 'is_community_pool', type: 'BOOLEAN', pk: false, notes: 'Default FALSE; community discovery' },
      { name: 'waveform_data', type: 'JSONB', pk: false, notes: 'Array of normalized 0-1 amplitude peaks' },
      { name: 'play_count', type: 'BIGINT', pk: false, notes: 'Total aggregate plays' },
      { name: 'created_at', type: 'TIMESTAMPTZ', pk: false, notes: 'Upload date' },
    ],
  },
  {
    name: 'audio_variants',
    description: 'Transcoded audio renditions stored in Cloudflare R2 for adaptive streaming.',
    columns: [
      { name: 'id', type: 'UUID', pk: true, notes: 'Primary Key' },
      { name: 'track_id', type: 'UUID FK -> tracks.id', pk: false, notes: 'Parent track' },
      { name: 'format', type: 'VARCHAR(10)', pk: false, notes: 'HLS, AAC, FLAC, MP3' },
      { name: 'bitrate_kbps', type: 'INT', pk: false, notes: '128, 256, 320, or lossless' },
      { name: 'r2_storage_key', type: 'VARCHAR(512)', pk: false, notes: 'Encrypted object key in R2' },
      { name: 'file_size_bytes', type: 'BIGINT', pk: false, notes: 'Size on storage' },
      { name: 'hls_manifest_url', type: 'TEXT', pk: false, notes: 'm3u8 playlist path' },
    ],
  },
  {
    name: 'playlists',
    description: 'Playlist container with privacy toggles and collaborative settings.',
    columns: [
      { name: 'id', type: 'UUID', pk: true, notes: 'Primary Key' },
      { name: 'owner_id', type: 'UUID FK -> users.id', pk: false, notes: 'Creator' },
      { name: 'title', type: 'VARCHAR(255)', pk: false, notes: 'Playlist title' },
      { name: 'description', type: 'TEXT', pk: false, notes: 'Optional summary' },
      { name: 'cover_art_url', type: 'TEXT', pk: false, notes: 'Playlist cover art' },
      { name: 'is_private', type: 'BOOLEAN', pk: false, notes: 'Default TRUE' },
      { name: 'is_collaborative', type: 'BOOLEAN', pk: false, notes: 'Enable multi-user track curation' },
      { name: 'created_at', type: 'TIMESTAMPTZ', pk: false, notes: 'Creation date' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', pk: false, notes: 'Last track added/modified' },
    ],
  },
  {
    name: 'playlist_collaborators',
    description: 'Fine-grained access rights mapping community members to shared playlists.',
    columns: [
      { name: 'id', type: 'UUID', pk: true, notes: 'Primary Key' },
      { name: 'playlist_id', type: 'UUID FK -> playlists.id', pk: false, notes: 'Target playlist' },
      { name: 'user_id', type: 'UUID FK -> users.id', pk: false, notes: 'Invited community user' },
      { name: 'role', type: 'playlist_role_enum', pk: false, notes: 'OWNER, EDITOR, CONTRIBUTOR, VIEWER' },
      { name: 'invited_by_id', type: 'UUID FK -> users.id', pk: false, notes: 'User who granted access' },
      { name: 'created_at', type: 'TIMESTAMPTZ', pk: false, notes: 'Invite timestamp' },
    ],
  },
  {
    name: 'playlist_tracks',
    description: 'Ordered association table linking tracks into playlists with position keys.',
    columns: [
      { name: 'id', type: 'UUID', pk: true, notes: 'Primary Key' },
      { name: 'playlist_id', type: 'UUID FK -> playlists.id', pk: false, notes: 'Parent playlist' },
      { name: 'track_id', type: 'UUID FK -> tracks.id', pk: false, notes: 'Target track' },
      { name: 'position', type: 'DOUBLE PRECISION', pk: false, notes: 'Fractional indexing for reordering' },
      { name: 'added_by_user_id', type: 'UUID FK -> users.id', pk: false, notes: 'Track contributor' },
      { name: 'added_at', type: 'TIMESTAMPTZ', pk: false, notes: 'Timestamp' },
    ],
  },
  {
    name: 'favorites',
    description: 'User track bookmarking and like registry.',
    columns: [
      { name: 'user_id', type: 'UUID FK -> users.id', pk: true, notes: 'Composite PK 1' },
      { name: 'track_id', type: 'UUID FK -> tracks.id', pk: true, notes: 'Composite PK 2' },
      { name: 'created_at', type: 'TIMESTAMPTZ', pk: false, notes: 'Favorited timestamp' },
    ],
  },
  {
    name: 'playback_history',
    description: 'Granular listening history and analytics ledger.',
    columns: [
      { name: 'id', type: 'UUID', pk: true, notes: 'Primary Key' },
      { name: 'user_id', type: 'UUID FK -> users.id', pk: false, notes: 'Listener' },
      { name: 'track_id', type: 'UUID FK -> tracks.id', pk: false, notes: 'Streamed track' },
      { name: 'duration_listened_sec', type: 'INT', pk: false, notes: 'Seconds listened' },
      { name: 'completed', type: 'BOOLEAN', pk: false, notes: 'True if > 80% duration' },
      { name: 'device_type', type: 'VARCHAR(50)', pk: false, notes: 'desktop, mobile_pwa, tablet' },
      { name: 'timestamp', type: 'TIMESTAMPTZ', pk: false, notes: 'Playback start' },
    ],
  },
  {
    name: 'audit_logs',
    description: 'Immutable security log for RBAC changes, member invitations, and deletions.',
    columns: [
      { name: 'id', type: 'UUID', pk: true, notes: 'Primary Key' },
      { name: 'actor_id', type: 'UUID FK -> users.id', pk: false, notes: 'Action initiator' },
      { name: 'action', type: 'VARCHAR(100)', pk: false, notes: 'USER_ROLE_CHANGED, TRACK_DELETED, etc.' },
      { name: 'target_id', type: 'VARCHAR(255)', pk: false, notes: 'Target entity ID' },
      { name: 'ip_address', type: 'INET', pk: false, notes: 'Hashed or client IP' },
      { name: 'user_agent', type: 'TEXT', pk: false, notes: 'Client user agent' },
      { name: 'payload', type: 'JSONB', pk: false, notes: 'Before/after state diff' },
      { name: 'created_at', type: 'TIMESTAMPTZ', pk: false, notes: 'Timestamp' },
    ],
  },
];
