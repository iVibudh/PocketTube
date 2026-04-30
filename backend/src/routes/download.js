const express = require('express');
const router = express.Router();
const path = require('path');
const { downloadMedia } = require('../utils/ytdlp');
const { uploadFile, uploadThumbnail } = require('../utils/storage');
const { createJob, updateJob } = require('../utils/jobs');
const { recordDownload } = require('../middleware/planCheck');

/**
 * POST /api/download
 *
 * Starts an async download job and returns the jobId immediately.
 * The mobile app polls GET /api/status/:jobId to track progress.
 *
 * Body:
 * {
 *   url:          string,           // YouTube URL
 *   format:       'audio'|'video',
 *   resolution:   number,           // optional — e.g. 720, 1080 (video only)
 *   thumbnailUrl: string,           // optional — from /api/info; uploaded alongside media
 *   metadata: {                     // optional — from /api/info; stored in result for Firestore
 *     videoId:    string,
 *     title:      string,
 *     channel:    string,
 *     uploadDate: string,
 *     duration:   number,
 *     sourceUrl:  string
 *   }
 * }
 *
 * Response: { jobId: string }
 *
 * When the job completes, GET /api/status/:jobId returns:
 * {
 *   status: 'done',
 *   progress: 100,
 *   result: {
 *     storageUrl:    string,   // signed 7-day URL for the media file
 *     storagePath:   string,   // e.g. users/uid/abc123.mp3
 *     thumbnailUrl:  string|null,
 *     thumbnailPath: string|null,
 *     filename:      string,
 *     format:        'audio'|'video',
 *     resolution:    number|null,
 *     metadata:      object
 *   }
 * }
 */
router.post('/', async (req, res) => {
  const { url, format, resolution, thumbnailUrl, metadata } = req.body;
  const userId = req.uid;

  if (!url || !format) {
    return res.status(400).json({ error: 'url and format are required' });
  }
  if (!['audio', 'video'].includes(format)) {
    return res.status(400).json({ error: 'format must be "audio" or "video"' });
  }

  // Create the job record and return the ID immediately — no waiting
  const jobId = createJob();
  res.json({ jobId });

  // ── Async worker ────────────────────────────────────────────────────────────
  ;(async () => {
    try {
      // 1. Download via yt-dlp (progress: 5 → 75 %)
      updateJob(jobId, { status: 'downloading', progress: 5 });

      const localPath = await downloadMedia(url, format, resolution, (frac) => {
        updateJob(jobId, { progress: Math.round(5 + frac * 70) }); // 5–75 %
      });

      // 2. Upload media + thumbnail in parallel (progress: 75 → 95 %)
      updateJob(jobId, { status: 'uploading', progress: 75 });

      const ext  = format === 'audio' ? 'mp3' : 'mp4';
      const stem = metadata?.videoId || path.basename(localPath, `.${ext}`);
      const fname = `${stem}.${ext}`;

      const [mediaResult, thumbResult] = await Promise.all([
        uploadFile(localPath, userId, fname),
        thumbnailUrl
          ? uploadThumbnail(thumbnailUrl, userId, stem)
          : Promise.resolve(null)
      ]);

      updateJob(jobId, { progress: 95 });

      // 3. Record the download for plan enforcement
      await recordDownload(userId);

      // 4. Mark done
      updateJob(jobId, {
        status:   'done',
        progress: 100,
        result: {
          storageUrl:    mediaResult.url,
          storagePath:   mediaResult.destination,
          thumbnailUrl:  thumbResult?.url   || thumbnailUrl || null,
          thumbnailPath: thumbResult?.destination || null,
          filename:      fname,
          format,
          resolution:    format === 'video' ? (resolution || null) : null,
          metadata:      {
            videoId:    metadata?.videoId    || stem,
            title:      metadata?.title      || fname,
            channel:    metadata?.channel    || '',
            uploadDate: metadata?.uploadDate || null,
            duration:   metadata?.duration   || null,
            sourceUrl:  metadata?.sourceUrl  || url
          }
        }
      });

    } catch (err) {
      console.error(`Job ${jobId} failed:`, err.message);
      updateJob(jobId, { status: 'error', error: err.message });
    }
  })();
});

module.exports = router;
