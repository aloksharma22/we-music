import { Track } from '../types';

interface MediaDirectoryEntry {
  youtubeId?: string;
  previewAudioUrl?: string;
  spotifyQuery?: string;
}

// Lazy-loaded media directory for 350+ commercial songs
let mediaDirectoryCache: Record<string, MediaDirectoryEntry> | null = null;

async function getMediaDirectory(): Promise<Record<string, MediaDirectoryEntry>> {
  if (mediaDirectoryCache) return mediaDirectoryCache;
  try {
    const data = await import('../data/mediaDirectory.json');
    mediaDirectoryCache = (data.default || data) as Record<string, MediaDirectoryEntry>;
    return mediaDirectoryCache;
  } catch (err) {
    console.warn('Could not load static mediaDirectory.json, falling back to dynamic resolution:', err);
    mediaDirectoryCache = {};
    return mediaDirectoryCache;
  }
}

class MediaResolverService {
  /**
   * Enriches a single track with pre-resolved YouTube video ID, real audio preview URL, and Spotify search link.
   */
  public async enrichTrack(track: Track): Promise<Track> {
    const dir = await getMediaDirectory();
    const entry = dir[track.id];

    if (entry) {
      return {
        ...track,
        youtubeId: entry.youtubeId || track.youtubeId,
        previewAudioUrl: entry.previewAudioUrl || track.previewAudioUrl,
        spotifyUrl: entry.spotifyQuery || track.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(track.artist + ' ' + track.title)}`,
      };
    }

    // Dynamic resolution if not found in dictionary
    const fallbackSpotify = `https://open.spotify.com/search/${encodeURIComponent(track.artist + ' ' + track.title)}`;
    return {
      ...track,
      spotifyUrl: track.spotifyUrl || fallbackSpotify,
    };
  }

  /**
   * Enriches an array of tracks (e.g. at app load or playlist view).
   */
  public async enrichTracks(tracks: Track[]): Promise<Track[]> {
    const dir = await getMediaDirectory();
    return tracks.map((track) => {
      const entry = dir[track.id];
      if (entry) {
        return {
          ...track,
          youtubeId: entry.youtubeId || track.youtubeId,
          previewAudioUrl: entry.previewAudioUrl || track.previewAudioUrl,
          spotifyUrl: entry.spotifyQuery || track.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(track.artist + ' ' + track.title)}`,
        };
      }
      return {
        ...track,
        spotifyUrl: track.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(track.artist + ' ' + track.title)}`,
      };
    });
  }

  /**
   * Returns a clean YouTube embed URL for a given track
   */
  public getYouTubeEmbedUrl(track: Track): string | null {
    if (track.youtubeId) {
      return `https://www.youtube-nocookie.com/embed/${track.youtubeId}?autoplay=1&enablejsapi=1&rel=0`;
    }
    return null;
  }

  /**
   * Returns a direct YouTube watch link
   */
  public getYouTubeWatchUrl(track: Track): string {
    if (track.youtubeId) {
      return `https://www.youtube.com/watch?v=${track.youtubeId}`;
    }
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(track.artist + ' ' + track.title + ' official audio')}`;
  }

  /**
   * Returns a direct Spotify web search/playback link
   */
  public getSpotifyUrl(track: Track): string {
    if (track.spotifyUrl) return track.spotifyUrl;
    return `https://open.spotify.com/search/${encodeURIComponent(track.artist + ' ' + track.title)}`;
  }

  /**
   * Resolves on-the-fly iTunes real audio preview if not pre-cached
   */
  public async resolveLiveAudioPreview(artist: string, title: string): Promise<string | null> {
    try {
      const q = encodeURIComponent(`${artist} ${title}`);
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
        return data.results[0].previewUrl;
      }
    } catch (e) {
      console.warn('Failed to resolve live audio preview:', e);
    }
    return null;
  }
}

export const mediaResolverService = new MediaResolverService();
