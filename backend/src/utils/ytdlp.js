const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DOWNLOADS_DIR = process.platform === 'win32'
  ? path.join(require('os').tmpdir(), 'pockettube-downloads')
  : '/tmp/downloads';

async function downloadMedia(url, format) {
  const id = uuidv4();
  const outPath = path.join(DOWNLOADS_DIR, id);
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

  const args = format === 'audio'
    ? ['-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', `${outPath}.%(ext)s`, url]
    : ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4', '-o', `${outPath}.%(ext)s`, url];

  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args);
    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      const ext = format === 'audio' ? 'mp3' : 'mp4';
      resolve(`${outPath}.${ext}`);
    });
    proc.on('error', (err) => reject(new Error(`yt-dlp not found: ${err.message}`)));
  });
}

module.exports = { downloadMedia };
