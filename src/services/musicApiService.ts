import { Track, AudioFormat } from '../types';
import { CURATED_CATALOG } from '../data/curatedMusicCatalog';

export interface iTunesSongResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  primaryGenreName?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  artworkUrl100?: string;
  previewUrl?: string;
}

export interface ApiFetchOptions {
  query: string;
  limit?: number;
  categoryHint?: 'english' | 'hindi' | 'punjabi' | 'hindi_retro';
}

class MusicApiService {
  /**
   * Clears old feed storage and re-initializes with the 370 curated most-listened tracks
   */
  public clearAndLoadCuratedFeed(): Track[] {
    try {
      localStorage.setItem('your_melody_tracks', JSON.stringify(CURATED_CATALOG));
    } catch (e) {
      console.error('Failed to persist feed to localStorage:', e);
    }
    return [...CURATED_CATALOG];
  }

  /**
   * Live search and fetch songs via the public iTunes Music API.
   * Free, no API keys required, CORS compliant, provides official 30s studio audio previews and 600x600 covers.
   */
  public async searchOnlineMusic(options: ApiFetchOptions): Promise<Track[]> {
    const { query, limit = 25, categoryHint = 'english' } = options;
    const cleanQuery = encodeURIComponent(query.trim());
    if (!cleanQuery) return [];

    const url = `https://itunes.apple.com/search?term=${cleanQuery}&entity=song&limit=${limit}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`iTunes API responded with status ${response.status}`);
      }

      const data = await response.json();
      const results: iTunesSongResult[] = data.results || [];

      return results
        .filter((item) => Boolean(item.trackName && item.artistName))
        .map((item) => {
          const highResCover = item.artworkUrl100
            ? item.artworkUrl100.replace('100x100bb', '600x600bb')
            : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

          const durationSec = Math.round((item.trackTimeMillis || 180000) / 1000);
          const releaseYear = item.releaseDate
            ? new Date(item.releaseDate).getFullYear()
            : 2024;

          return {
            id: `api_itunes_${item.trackId}`,
            title: item.trackName,
            artist: item.artistName,
            album: item.collectionName || `${item.trackName} - Single`,
            genre: item.primaryGenreName || 'Pop',
            category: categoryHint,
            duration: durationSec,
            releaseYear: isNaN(releaseYear) ? 2024 : releaseYear,
            coverArtUrl: highResCover,
            uploaderId: 'usr_itunes_api',
            uploaderName: 'Apple Music API',
            uploaderUsername: 'applemusic',
            isPrivate: false,
            fileSizeBytes: Math.floor((durationSec * 256 * 1024) / 8),
            format: 'AAC' as AudioFormat,
            bitrateKbps: 256,
            waveform: [
              0.2, 0.4, 0.65, 0.8, 0.95, 0.88, 0.72, 0.85, 0.9, 0.75, 0.6, 0.8,
              0.92, 0.84, 0.68, 0.5, 0.65, 0.78, 0.62, 0.45, 0.35, 0.2,
            ],
            audioPreset: 'synthwave',
            streamUrl: item.previewUrl || '',
            createdAt: new Date().toISOString(),
            playCount: 420 + Math.floor(Math.random() * 800),
            isFavorite: false,
            isCachedOffline: false,
          };
        });
    } catch (err) {
      console.error('Error fetching songs from iTunes API:', err);
      throw err;
    }
  }

  /**
   * Pre-packaged categories for quick 1-click batch import from live API
   */
  public getPresetSearchQueries() {
    return [
      { label: 'English Pop Chart', query: 'Top Hits English 2024', category: 'english' as const },
      { label: 'Arijit Singh Hits', query: 'Arijit Singh Bollywood', category: 'hindi' as const },
      { label: 'Diljit Dosanjh Punjabi', query: 'Diljit Dosanjh', category: 'punjabi' as const },
      { label: 'Karan Aujla Punjabi', query: 'Karan Aujla', category: 'punjabi' as const },
      { label: 'Kishore Kumar Retro', query: 'Kishore Kumar', category: 'hindi_retro' as const },
      { label: 'Lata Mangeshkar Retro', query: 'Lata Mangeshkar Golden Hits', category: 'hindi_retro' as const },
      { label: 'The Weeknd & Drake', query: 'The Weeknd Starboy', category: 'english' as const },
      { label: 'Coldplay Anthems', query: 'Coldplay Viva La Vida', category: 'english' as const },
    ];
  }
}

export const musicApiService = new MusicApiService();
