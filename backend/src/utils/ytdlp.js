const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DOWNLOADS_DIR = process.platform === 'win32'
  ? path.join(require('os').tmpdir(), 'pockettube-downloads')
  : '/tmp/downloads';

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
      '--extractor-args', 'youtube:player_client=ios,web',
      '--no-check-certificates',
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
    // Build a format selector that respects the requested resolution cap
    const heightCap = resolution ? `[height<=${resolution}]` : '';
    formatArgs = [
      '-f',
      `bestvideo${heightCap}[ext=mp4]+bestaudio[ext=m4a]/bestvideo${heightCap}+bestaudio/best${heightCap}[ext=mp4]/best${heightCap}`
    ];
  }

  const args = [
    ...formatArgs,
    '--no-playlist',
    '--newline',                // one progress line per update — easier to parse
    '--extractor-args', 'youtube:player_client=ios,web',
    '--no-check-certificates',
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
      if (code !== 0) return reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      const ext = format === 'audio' ? 'mp3' : 'mp4';
      const filePath = `${outPath}.${ext}`;
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`Expected output file not found: ${filePath}`));
      }
      resolve(filePath);
    });

    proc.on('error', err => reject(new Error(`yt-dlp not found: ${err.message}`)));
  });
}

module.exports = { getVideoInfo, downloadMedia };
