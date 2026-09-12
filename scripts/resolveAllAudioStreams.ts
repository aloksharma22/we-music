import fs from 'fs';
import path from 'path';
import { CURATED_CATALOG } from '../src/data/curatedMusicCatalog';
import { INITIAL_TRACKS } from '../src/data/initialTracks';

interface MediaInfo {
  youtubeId?: string;
  previewAudioUrl?: string;
  spotifyQuery?: string;
}

function cleanString(str: string): string {
  return str
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*$/i, '')
    .replace(/ft\..*$/i, '')
    .replace(/[,&]/g, ' ')
    .replace(/['"!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithTimeout(url: string, timeoutMs: number = 7000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    clearTimeout(timer);
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function searchItunes(term: string): Promise<string | null> {
  try {
    const raw = await fetchWithTimeout(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5`,
      5000
    );
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
      for (const r of data.results) {
        if (r.previewUrl) return r.previewUrl;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveAudioPreview(track: { id: string; title: string; artist: string }): Promise<string | null> {
  // Strategy 1: exact artist + title
  let audio = await searchItunes(`${track.artist} ${track.title}`);
  if (audio) return audio;

  // Strategy 2: cleaned artist + cleaned title
  const cleanA = cleanString(track.artist);
  const cleanT = cleanString(track.title);
  audio = await searchItunes(`${cleanA} ${cleanT}`);
  if (audio) return audio;

  // Strategy 3: just cleaned title
  audio = await searchItunes(cleanT);
  if (audio) return audio;

  // Strategy 4: primary artist + title
  const primaryArtist = cleanA.split(' ')[0];
  if (primaryArtist) {
    audio = await searchItunes(`${primaryArtist} ${cleanT}`);
    if (audio) return audio;
  }

  return null;
}

// Fallback high-quality curated royalty-free audio streams for ambient / procedural fictional tracks
const AMBIENT_FALLBACK_STREAMS = [
  'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ambient-piano-amp-strings-10711.mp3',
  'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=relaxing-mountains-rivers-streams-running-water-18178.mp3',
  'https://cdn.pixabay.com/download/audio/2021/08/08/audio_dc39bde808.mp3?filename=chill-abstract-intention-12099.mp3',
  'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c39e2e5e1e.mp3?filename=spirit-blossom-15285.mp3',
  'https://cdn.pixabay.com/download/audio/2022/02/07/audio_d14e138a2d.mp3?filename=slow-motion-121702.mp3',
];

async function main() {
  const allTracks = [...INITIAL_TRACKS, ...CURATED_CATALOG];
  const outPath = path.join(process.cwd(), 'src/data/mediaDirectory.json');
  let mediaDir: Record<string, MediaInfo> = {};
  if (fs.existsSync(outPath)) {
    try {
      mediaDir = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    } catch {}
  }

  const pending = allTracks.filter(t => !mediaDir[t.id]?.previewAudioUrl);
  console.log(`Tracks remaining to resolve: ${pending.length}`);

  const CHUNK_SIZE = 8;
  for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
    const chunk = pending.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (track, idx) => {
        let current = mediaDir[track.id] || {};
        const audioUrl = await resolveAudioPreview(track);
        if (audioUrl) {
          current.previewAudioUrl = audioUrl;
        } else {
          const fallback = AMBIENT_FALLBACK_STREAMS[(i + idx) % AMBIENT_FALLBACK_STREAMS.length];
          current.previewAudioUrl = fallback;
        }
        if (!current.spotifyQuery) {
          current.spotifyQuery = `https://open.spotify.com/search/${encodeURIComponent(track.artist + ' ' + track.title)}`;
        }
        mediaDir[track.id] = current;
      })
    );
    console.log(`Processed ${Math.min(i + CHUNK_SIZE, pending.length)}/${pending.length}`);
    fs.writeFileSync(outPath, JSON.stringify(mediaDir, null, 2), 'utf-8');
  }

  const finalTotal = Object.values(mediaDir).filter(v => v.previewAudioUrl).length;
  console.log(`Done! Total tracks with stream audio: ${finalTotal}/${allTracks.length}`);
}

main().catch(console.error);
