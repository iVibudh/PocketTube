const admin = require('./firebase');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const os = require('os');

const bucket = admin.storage().bucket();

// Signed URL expiry — 7 days. The mobile downloads the file immediately after
// receiving the URL, so this is generous.
const SIGNED_URL_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Uploads a local media file to Firebase Storage under users/{userId}/{filename}.
 * Deletes the local temp file after a successful upload.
 *
 * @returns {{ url: string, destination: string }}
 */
async function uploadFile(localPath, userId, filename) {
  const destination = `users/${userId}/${filename}`;
  const contentType = filename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4';

  await bucket.upload(localPath, {
    destination,
    metadata: { contentType }
  });

  const [url] = await bucket.file(destination).getSignedUrl({
    action: 'read',
    expires: Date.now() + SIGNED_URL_EXPIRY_MS
  });

  fs.unlinkSync(localPath); // clean up temp file
  return { url, destination };
}

/**
 * Downloads a thumbnail from a remote URL and uploads it to Firebase Storage
 * at users/{userId}/thumbnails/{videoId}.jpg.
 *
 * @param {string} thumbnailUrl - Remote thumbnail URL from yt-dlp
 * @param {string} userId
 * @param {string} videoId - Used as the filename stem
 * @returns {{ url: string, destination: string }}
 */
async function uploadThumbnail(thumbnailUrl, userId, videoId) {
  const localPath = path.join(os.tmpdir(), `${videoId}_thumb.jpg`);

  // Download the thumbnail to a temp file
  await downloadRemoteFile(thumbnailUrl, localPath);

  const destination = `users/${userId}/thumbnails/${videoId}.jpg`;

  await bucket.upload(localPath, {
    destination,
    metadata: { contentType: 'image/jpeg' }
  });

  const [url] = await bucket.file(destination).getSignedUrl({
    action: 'read',
    expires: Date.now() + SIGNED_URL_EXPIRY_MS
  });

  try { fs.unlinkSync(localPath); } catch { /* ignore */ }

  return { url, destination };
}

/**
 * Downloads a remote URL to a local file path.
 * Follows redirects. Supports http and https.
 */
function downloadRemoteFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol.get(url, response => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return downloadRemoteFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${response.statusCode} fetching thumbnail`));
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(destPath, () => {}); // clean up on error
      reject(err);
    });
  });
}

module.exports = { uploadFile, uploadThumbnail };
