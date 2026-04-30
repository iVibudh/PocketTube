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
 *     localPath:   string,         // temp file path on server -- used by GET /api/file/:jobId
 *     filename:    string,         // e.g. "dQw4w9WgXcQ.mp3"
 *     format:      'audio'|'video',
 *     resolution:  number|null,    // e.g. 720 for video; null for audio
 *     metadata: {
 *       videoId, title, channel, uploadDate, duration, thumbnailUrl, sourceUrl
 *     }
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
