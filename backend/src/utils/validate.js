/**
 * validate.js — shared input-validation helpers
 *
 * Centralising these keeps the rules consistent across /api/info and
 * /api/download and makes them easy to tighten later.
 */

// Matches standard YouTube watch URLs, shortened youtu.be links, and
// /shorts/ URLs.  Query-string parameters (playlist, t=…, etc.) are
// intentionally allowed because yt-dlp handles them correctly and
// users may paste links that include them.
const YOUTUBE_URL_RE =
  /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]{11}/;

/**
 * Returns true if `url` looks like a valid YouTube URL we are willing to
 * pass to yt-dlp.  Does NOT make a network request.
 *
 * @param {string} url
 * @returns {boolean}
 */
function isValidYouTubeUrl(url) {
  return typeof url === 'string' && YOUTUBE_URL_RE.test(url);
}

// The only resolution values the mobile app is allowed to request.
// Anything outside this list is rejected with 400.
const ALLOWED_RESOLUTIONS = new Set([360, 480, 720, 1080, 1440, 2160]);

/**
 * Returns true if `resolution` is either undefined/null (meaning "best
 * available") or one of the explicitly allowed values.
 *
 * @param {number|undefined|null} resolution
 * @returns {boolean}
 */
function isValidResolution(resolution) {
  if (resolution === undefined || resolution === null) return true;
  return ALLOWED_RESOLUTIONS.has(Number(resolution));
}

module.exports = { isValidYouTubeUrl, isValidResolution, ALLOWED_RESOLUTIONS };
