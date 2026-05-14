const express = require('express');
const router = express.Router();
const path = require('path');
const { downloadMedia } = require('../utils/ytdlp');
const { createJob, updateJob } = require('../utils/jobs');
const { isValidYouTubeUrl, isValidResolution } = require('../utils/validate');

/**
 * POST /api/download
 *
 * Starts an async download job and returns a jobId immediately.
 * Poll GET /api/status/:jobId for progress, then fetch the file
 * via GET /api/file/:jobId once status === 'done'.
 *
 * No Firebase Storage is used -- files are served directly from /tmp.
 *
 * Body:
 *   url          {string}  YouTube URL
 *   format       {string}  'audio' | 'video'
 *   resolution   {number}  optional -- e.g. 720, 1080 (video only)
 *   metadata     {object}  optional -- from /api/info; echoed back in result
 *     videoId, title, channel, uploadDate, duration, thumbnailUrl, sourceUrl
 *
 * Response: { jobId }
 */
router.post('/', async (req, res) => {
  const { url, format, resolution, metadata } = req.body;

  if (!url || !format) {
    return res.status(400).json({ error: 'url and format are required' });
  }
  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'url must be a valid YouTube URL' });
  }
  if (!['audio', 'video'].includes(format)) {
    return res.status(400).json({ error: 'format must be "audio" or "video"' });
  }
  if (!isValidResolution(resolution)) {
    return res.status(400).json({ error: 'resolution must be one of: 360, 480, 720, 1080, 1440, 2160' });
  }

  const jobId = createJob();
  res.json({ jobId });

  ;(async () => {
    try {
      updateJob(jobId, { status: 'downloading', progress: 5 });

      const localPath = await downloadMedia(url, format, resolution, (frac) => {
        updateJob(jobId, { progress: Math.round(5 + frac * 90) });
      });

      // Derive the extension from the actual output file returned by yt-dlp
      // (which may be .mp4, .mp3, or occasionally .mkv as a last resort).
      const ext      = path.extname(localPath).slice(1) || (format === 'audio' ? 'mp3' : 'mp4');
      const stem     = metadata && metadata.videoId
        ? metadata.videoId
        : path.basename(localPath, '.' + ext);
      const filename = stem + '.' + ext;

      updateJob(jobId, {
        status:   'done',
        progress: 100,
        result: {
          localPath,
          filename,
          format,
          resolution: format === 'video' ? (resolution || null) : null,
          metadata: {
            videoId:      (metadata && metadata.videoId)      || stem,
            title:        (metadata && metadata.title)        || filename,
            channel:      (metadata && metadata.channel)      || '',
            uploadDate:   (metadata && metadata.uploadDate)   || null,
            duration:     (metadata && metadata.duration)     || null,
            thumbnailUrl: (metadata && metadata.thumbnailUrl) || null,
            sourceUrl:    (metadata && metadata.sourceUrl)    || url
          }
        }
      });

    } catch (err) {
      console.error('Job ' + jobId + ' failed:', err.message);
      updateJob(jobId, { status: 'error', error: err.message });
    }
  })();
});

module.exports = router;
