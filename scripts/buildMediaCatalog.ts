import fs from 'fs';
import path from 'path';
import { CURATED_CATALOG } from '../src/data/curatedMusicCatalog';
import { INITIAL_TRACKS } from '../src/data/initialTracks';

interface MediaInfo {
  youtubeId: string;
  previewAudioUrl?: string;
  spotifyQuery: string;
}

async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    clearTimeout(timer);
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function resolveTrack(track: { id: string; title: string; artist: string }): Promise<{ id: string; info: MediaInfo }> {
  const q = `${track.artist} ${track.title}`;
  const spotifyQuery = encodeURIComponent(q);

  // 1. YouTube ID
  let youtubeId = '';
  const ytHtml = await fetchWithTimeout(`https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' official audio')}`, 6000);
  if (ytHtml) {
    const match = ytHtml.match(/watch\?v=([a-zA-Z0-9_-]{11})/) || ytHtml.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (match && match[1]) {
      youtubeId = match[1];
    }
  }

  // Fallback if not found with 'official audio'
  if (!youtubeId) {
    const ytHtmlFallback = await fetchWithTimeout(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, 6000);
    if (ytHtmlFallback) {
      const match = ytHtmlFallback.match(/watch\?v=([a-zA-Z0-9_-]{11})/) || ytHtmlFallback.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        youtubeId = match[1];
      }
    }
  }

  // 2. Audio Preview (iTunes)
  let previewAudioUrl = '';
  try {
    const itunesRes = await fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=1`);
    if (itunesRes) {
      const data = JSON.parse(itunesRes);
      if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
        previewAudioUrl = data.results[0].previewUrl;
      }
    }
  } catch {}

  return {
    id: track.id,
    info: {
      youtubeId,
      previewAudioUrl: previewAudioUrl || undefined,
      spotifyQuery: `https://open.spotify.com/search/${spotifyQuery}`,
    },
  };
}

async function main() {
  const allTracks = [...INITIAL_TRACKS, ...CURATED_CATALOG];
  const outPath = path.join(process.cwd(), 'src/data/mediaDirectory.json');
  
  let results: Record<string, MediaInfo> = {};
  if (fs.existsSync(outPath)) {
    try {
      results = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    } catch {}
  }

  const tracksToProcess = allTracks.filter(t => !results[t.id] || !results[t.id].youtubeId);
  console.log(`Total tracks: ${allTracks.length}, remaining to resolve: ${tracksToProcess.length}`);

  const batchSize = 15;
  for (let i = 0; i < tracksToProcess.length; i += batchSize) {
    const batch = tracksToProcess.slice(i, i + batchSize);
    const resolvedBatch = await Promise.all(batch.map(resolveTrack));
    for (const item of resolvedBatch) {
      results[item.id] = item.info;
    }
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`Saved ${Object.keys(results).length} / ${allTracks.length} tracks`);
  }

  console.log(`DONE! Successfully saved all ${Object.keys(results).length} tracks to mediaDirectory.json`);
}

main().catch(console.error);
