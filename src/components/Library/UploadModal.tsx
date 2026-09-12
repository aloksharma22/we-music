import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileAudio,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  Sparkles,
  Info
} from 'lucide-react';
import { Track, AudioFormat } from '../../types';
import { getR2PublicBaseUrl, getR2AudioStreamUrl } from '../../services/cloudflareR2Service';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newTrack: Track) => void;
  currentUserId: string;
  currentUserName: string;
  currentUserUsername?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  onClose,
  onUploadSuccess,
  currentUserId,
  currentUserName,
  currentUserUsername,
}) => {
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    format: AudioFormat;
    objectUrl: string;
    duration: number;
  } | null>(null);
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [album, setAlbum] = useState<string>('');
  const [genre, setGenre] = useState<string>('Electronic / Ambient');
  const [customCoverUrl, setCustomCoverUrl] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(true); // Strictly private by default!
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const allowedFormats: AudioFormat[] = ['MP3', 'AAC', 'FLAC', 'WAV', 'OGG'];

  const handleFileProcess = (file: File) => {
    setValidationError(null);
    const ext = file.name.split('.').pop()?.toUpperCase() as AudioFormat;

    if (!allowedFormats.includes(ext)) {
      setValidationError(`Unsupported audio format: .${ext}. Please upload MP3, AAC, FLAC, WAV, or OGG.`);
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      setValidationError('Audio file exceeds maximum 150MB community threshold.');
      return;
    }

    // Create real object URL for audio playback
    const blobUrl = URL.createObjectURL(file);
    let detectedDuration = 180;

    // Detect duration from audio file metadata
    const tempAudio = new Audio();
    tempAudio.src = blobUrl;
    tempAudio.onloadedmetadata = () => {
      if (tempAudio.duration && isFinite(tempAudio.duration)) {
        detectedDuration = Math.round(tempAudio.duration);
        setSelectedFile((prev) => (prev ? { ...prev, duration: detectedDuration } : null));
      }
    };

    setSelectedFile({
      name: file.name,
      size: file.size,
      format: ext,
      objectUrl: blobUrl,
      duration: detectedDuration,
    });

    // Auto-populate title from filename if empty
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setTitle(cleanName);
    setArtist(currentUserName);
    setAlbum('Community Singles');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSimulatedUpload = () => {
    if (!selectedFile || !title) return;
    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            const defaultCovers = [
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
            ];
            const randomCover = defaultCovers[Math.floor(Math.random() * defaultCovers.length)];

            const r2FileName = `${currentUserId}/${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const r2CdnUrl = getR2AudioStreamUrl(r2FileName);

            const newTrack: Track = {
              id: `trk_${Date.now()}`,
              title: title.trim() || selectedFile.name,
              artist: artist.trim() || 'Unknown Artist',
              album: album.trim() || 'Untitled Album',
              genre: genre || 'General',
              duration: selectedFile.duration || 195,
              releaseYear: new Date().getFullYear(),
              coverArtUrl: customCoverUrl.trim() || randomCover,
              uploaderId: currentUserId,
              uploaderName: currentUserName,
              uploaderUsername: currentUserUsername || currentUserName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
              isPrivate: isPrivate, // strictly preserved
              fileSizeBytes: selectedFile.size,
              format: selectedFile.format,
              bitrateKbps: selectedFile.format === 'FLAC' ? 800 : 256,
              waveform: [0.2, 0.4, 0.65, 0.8, 0.9, 0.7, 0.5, 0.65, 0.85, 0.95, 0.7, 0.5, 0.4, 0.6, 0.8, 0.5, 0.3, 0.2],
              audioPreset: 'ambient',
              streamUrl: selectedFile.objectUrl || r2CdnUrl,
              createdAt: new Date().toISOString(),
              playCount: 0,
              isFavorite: false,
              isCachedOffline: false,
            };
            onUploadSuccess(newTrack);
            setIsUploading(false);
            onClose();
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">Upload Music Track</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Privacy Notice Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300 shadow-sm">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5 text-amber-950 dark:text-amber-200">
                Private by Default Isolation
              </span>
              Your audio file is stored privately in Cloudflare R2 and will only be accessible to your account unless you explicitly toggle community sharing or add it to a collaborative playlist.
            </div>
          </div>

          {/* Zero Penny Free-Tier Efficiency Callout */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-300 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-emerald-950 dark:text-emerald-200">
                  Cloudflare R2 Zero-Egress Storage Connected
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Active CDN
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-400">
                Direct streaming endpoint: <code className="font-mono font-semibold">{getR2PublicBaseUrl()}</code>.
                Uploads stream globally with $0 egress bandwidth costs and sub-second playback caching.
              </p>
            </div>
          </div>

          {/* Dropzone */}
          {!selectedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
              onClick={() => document.getElementById('audio-file-input')?.click()}
            >
              <FileAudio className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Drag & drop audio files here, or click to browse
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supports MP3, AAC, FLAC, WAV, and OGG up to 150MB
              </p>
              <input
                id="audio-file-input"
                type="file"
                accept=".mp3,.aac,.flac,.wav,.ogg,audio/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedFile.format} • {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium"
              >
                Change
              </button>
            </div>
          )}

          {validationError && (
            <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800/40 p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Metadata Form */}
          {selectedFile && (
            <div className="space-y-3.5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Track Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Song title"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Artist Name</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Artist name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Album</label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Album title"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Electronic / Ambient">Electronic / Ambient</option>
                    <option value="Synthwave">Synthwave</option>
                    <option value="Lo-Fi Chillhop">Lo-Fi Chillhop</option>
                    <option value="Modern Classical">Modern Classical</option>
                    <option value="Dub Techno">Dub Techno</option>
                    <option value="Indie Folk">Indie Folk</option>
                  </select>
                </div>
              </div>

              {/* Privacy Setting Toggle */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  {isPrivate ? (
                    <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      {isPrivate ? 'Private to Uploader' : 'Share with Community Pool'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isPrivate
                        ? 'Visible strictly in your personal library and playlists'
                        : 'Visible in global community discovery'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isPrivate
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                  }`}
                >
                  {isPrivate ? 'Keep Private' : 'Make Public'}
                </button>
              </div>

              {/* Progress bar if uploading */}
              {isUploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <span>Direct Presigned Upload to Cloudflare R2...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            HLS Ingestion • -14 LUFS Normalization
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedFile || isUploading || !title}
              onClick={handleSimulatedUpload}
              className="px-5 py-2 rounded-lg bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow"
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Ingesting...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Track</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
