const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DOWNLOADS_DIR = process.platform === 'win32'
  ? path.join(require('os').tmpdir(), 'pockettube-downloads')
  : '/tmp/downloads';

// ffmpeg location — hardcoded for Windows (installed via winget)
const FFMPEG_LOCATION = process.platform === 'win32'
  ? 'C:\\Users\\vibud\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe'
  : 'ffmpeg';

/**
 * _cleanPartials(dir, id)
 *
 * Deletes all files in `dir` whose name begins with `id`.
 * Called after a yt-dlp failure to remove partial / intermediate files
 * (e.g. .part, .ytdl, half-merged .mp4) so they don't accumulate in /tmp.
 * Errors are silently swallowed — cleanup failure must not mask the
 * original download error.
 */
function _cleanPartials(dir, id) {
  try {
    const entries = fs.readdirSync(dir).filter(f => f.startsWith(id));
    for (const entry of entries) {
      try { fs.unlinkSync(path.join(dir, entry)); } catch (_) {}
    }
  } catch (_) {}
}

/**
 * Fetches video metadata (title, channel, duration, thumbnail, available
 * resolutions, etc.) without downloading the media file.
 *
 * @param {string} url - YouTube URL
 * @returns {Promise<object>} Raw yt-dlp JSON info object
 */
async function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', [
      '--dump-json',
      '--no-playlist',
      '--no-download',
      '--extractor-args', 'youtube:player_client=android_vr',
      '--ffmpeg-location', FFMPEG_LOCATION,
      url
    ]);

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', code => {
      if (code !== 0) return reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('Failed to parse yt-dlp metadata output'));
      }
    });

    proc.on('error', err => reject(new Error(`yt-dlp not found: ${err.message}`)));
  });
}

/**
 * Downloads audio or video from a YouTube URL via yt-dlp.
 *
 * @param {string}   url        - YouTube URL
 * @param {string}   format     - 'audio' | 'video'
 * @param {number}   [resolution] - Target height in px for video (e.g. 720, 1080).
 *                                  If omitted, downloads best available quality.
 * @param {Function} [onProgress] - Called with a float 0–1 as download progresses.
 * @returns {Promise<string>} Absolute path to the downloaded local file.
 */
async function downloadMedia(url, format, resolution, onProgress) {
  const id = uuidv4();
  const outPath = path.join(DOWNLOADS_DIR, id);
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

  let formatArgs;
  if (format === 'audio') {
    formatArgs = ['-x', '--audio-format', 'mp3', '--audio-quality', '0'];
  } else {
    // ── iOS-compatible video format selection ──────────────────────────────
    //
    // Root cause of the "black screen / audio only" bug:
    // YouTube's best-quality streams are VP9 (WebM) or AV1, neither of
    // which iOS hardware-decodes in expo-video. We must force H.264 (AVC).
    //
    // Strategy (in preference order):
    //  1. Best H.264 mp4 video  + m4a audio  → merge into mp4  (ideal)
    //  2. Best H.264 video      + any audio  → merge into mp4  (fallback)
    //  3. Best pre-muxed mp4 at the cap      → no merge needed (last resort)
    //
    // vcodec^=avc  matches "avc1", "avc1.64001f", etc. (all H.264 variants)
    //
    // --postprocessor-args adds two ffmpeg flags:
    //   -movflags +faststart  moves the moov atom to the file header so iOS
    //                         can start reading metadata before the full
    //                         file is downloaded / memory-mapped.
    //   -c:a aac              re-encodes audio to AAC if it isn't already,
    //                         ensuring the container is fully iOS-compatible.
    const cap = resolution ? `[height<=${resolution}]` : '';
    formatArgs = [
      '-f',
      `bestvideo${cap}[ext=mp4][vcodec^=avc]+bestaudio[ext=m4a]` +
      `/bestvideo${cap}[vcodec^=avc]+bestaudio` +
      `/best${cap}[ext=mp4]`,
      '--merge-output-format', 'mp4',
      '--postprocessor-args', 'ffmpeg:-movflags +faststart -c:a aac',
    ];
  }

  const args = [
    ...formatArgs,
    '--no-playlist',
    '--newline',                // one progress line per update — easier to parse
    '--extractor-args', 'youtube:player_client=android_vr',
    '--ffmpeg-location', FFMPEG_LOCATION,
    '-o', `${outPath}.%(ext)s`,
    url
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args);
    let stderr = '';

    // Parse [download] XX.X% progress lines from stdout
    proc.stdout.on('data', data => {
      const line = data.toString();
      const match = line.match(/\[download\]\s+([\d.]+)%/);
      if (match && onProgress) {
        onProgress(parseFloat(match[1]) / 100);
      }
    });

    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', code => {
      if (code !== 0) {
        // Clean up any partial / intermediate files left by yt-dlp or ffmpeg
        // before rejecting so they don't accumulate in /tmp.
        _cleanPartials(DOWNLOADS_DIR, id);
        return reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      }

      // Glob for the actual output file — don't assume the extension.
      // yt-dlp normally honours --merge-output-format mp4, but if it
      // downloaded a pre-muxed stream the extension is whatever the
      // source container was. Scanning for the job UUID is the safest
      // way to find the file regardless of what extension was used.
      const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.startsWith(id));
      if (files.length === 0) {
        return reject(new Error(`Output file not found for job ${id}`));
      }
      resolve(path.join(DOWNLOADS_DIR, files[0]));
    });

    proc.on('error', err => {
      _cleanPartials(DOWNLOADS_DIR, id);
      reject(new Error(`yt-dlp not found: ${err.message}`));
    });
  });
}

module.exports = { getVideoInfo, downloadMedia };
