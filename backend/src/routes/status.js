const express = require('express');
const router = express.Router();
const { getJob } = require('../utils/jobs');

/**
 * GET /api/status/:jobId
 *
 * Mobile polls this after POST /api/download returns a jobId.
 *
 * Response while in-progress:
 * { id, status: 'downloading'|'uploading', progress: 0–100 }
 *
 * Response on success:
 * {
 *   id, status: 'done', progress: 100,
 *   result: {
 *     storageUrl:    string,   // signed URL to media file in Firebase Storage
 *     storagePath:   string,   // Storage path  e.g. users/uid/abc123.mp3
 *     thumbnailUrl:  string,   // signed URL to thumbnail in Firebase Storage
 *     thumbnailPath: string,   // Storage path  e.g. users/uid/thumbnails/abc123.jpg
 *     filename:      string,
 *     format:        'audio'|'video',
 *     resolution:    number|null,
 *     metadata: { videoId, title, channel, uploadDate, duration, sourceUrl }
 *   }
 * }
 *
 * Response on failure:
 * { id, status: 'error', error: string }
 */
router.get('/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found or expired' });
  res.json(job);
});

module.exports = router;
