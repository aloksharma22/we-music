-- ==============================================================================
-- WE MUSIC: SUPABASE DATABASE INITIALIZATION SCHEMA
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES TABLE
-- Automatically populated upon Google OAuth registration or login
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MODERATOR', 'MEMBER')),
  auth_provider TEXT DEFAULT 'google',
  storage_used_bytes BIGINT DEFAULT 0,
  storage_quota_bytes BIGINT DEFAULT 10737418240, -- 10 GB
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger: Automatically create public.profile when a new user signs up with Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, email, avatar_url, auth_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'user_name', split_part(NEW.email, '@', 1)), '[^a-zA-Z0-9_]', '', 'g')) || '_' || SUBSTRING(NEW.id::text, 1, 4),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
    'google'
  )
  ON CONFLICT (id) DO UPDATE SET
    last_active_at = NOW(),
    avatar_url = EXCLUDED.avatar_url,
    name = EXCLUDED.name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. USER PLAYLISTS TABLE
CREATE TABLE IF NOT EXISTS public.playlists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_art_url TEXT DEFAULT '',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  owner_username TEXT,
  is_private BOOLEAN DEFAULT false,
  is_collaborative BOOLEAN DEFAULT false,
  track_count INT DEFAULT 0,
  total_duration INT DEFAULT 0,
  track_ids JSONB DEFAULT '[]'::jsonb,
  collaborators JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public playlists are viewable by everyone"
  ON public.playlists FOR SELECT
  USING (is_private = false OR auth.uid() = owner_id);

CREATE POLICY "Users can create their own playlists"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own playlists"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own playlists"
  ON public.playlists FOR DELETE
  USING (auth.uid() = owner_id);


-- 3. USER FAVORITE TRACKS TABLE
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, track_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON public.user_favorites FOR DELETE
  USING (auth.uid() = user_id);


-- 4. TRACK COMMENTS & REPLIES TABLE
CREATE TABLE IF NOT EXISTS public.track_comments (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  username TEXT NOT NULL,
  user_avatar TEXT,
  user_role TEXT DEFAULT 'MEMBER',
  text TEXT NOT NULL,
  track_timestamp_sec INT,
  likes_count INT DEFAULT 0,
  liked_by JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  replies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.track_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.track_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can post comments"
  ON public.track_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.track_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.track_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime subscriptions on comments and playlists
ALTER PUBLICATION supabase_realtime ADD TABLE public.track_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlists;
