const express = require('express');
const router = express.Router();
const { getVideoInfo } = require('../utils/ytdlp');

/**
 * POST /api/info
 * Body: { url: string }
 *
 * Returns video metadata and available resolutions without downloading anything.
 * The mobile app calls this first so the user can see the title, duration,
 * thumbnail and choose a resolution before committing to a download.
 *
 * Response:
 * {
 *   videoId:      string,          // YouTube video ID — used for duplicate detection
 *   title:        string,
 *   channel:      string,
 *   uploadDate:   string,          // "YYYYMMDD"
 *   duration:     number,          // seconds
 *   thumbnailUrl: string,          // best available thumbnail URL
 *   resolutions:  number[]         // e.g. [1080, 720, 480, 360] — sorted high→low
 * }
 */
router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const info = await getVideoInfo(url);

    // Extract unique video heights from the available formats, sorted high→low
    const resolutions = [
      ...new Set(
        (info.formats || [])
          .filter(f => f.vcodec && f.vcodec !== 'none' && f.height)
          .map(f => f.height)
      )
    ].sort((a, b) => b - a);

    res.json({
      videoId:      info.id,
      title:        info.title,
      channel:      info.uploader || info.channel || info.uploader_id || 'Unknown',
      uploadDate:   info.upload_date || null,   // "YYYYMMDD"
      duration:     info.duration || null,      // seconds
      thumbnailUrl: info.thumbnail || null,
      resolutions                               // empty array for audio-only sources
    });
  } catch (err) {
    console.error('Info fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
