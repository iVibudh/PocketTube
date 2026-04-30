const express = require('express');
const router = express.Router();
const fs = require('fs');
const { getJob } = require('../utils/jobs');

/**
 * GET /api/file/:jobId
 *
 * Streams the downloaded media file directly to the mobile app.
 * The mobile saves it to local device storage using expo-file-system.
 * The temp file is deleted from the server after it is fully sent.
 *
 * 404 -- job not found or not yet complete
 * 410 -- file already served and cleaned up (or server restarted)
 */
router.get('/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired' });
  }
  if (job.status !== 'done') {
    return res.status(404).json({ error: 'Job is not ready yet (status: ' + job.status + ')' });
  }

  const localPath = job.result.localPath;
  const filename  = job.result.filename;
  const format    = job.result.format;

  if (!fs.existsSync(localPath)) {
    return res.status(410).json({ error: 'File already served or server restarted' });
  }

  const contentType = format === 'audio' ? 'audio/mpeg' : 'video/mp4';
  const stat = fs.statSync(localPath);

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

  const stream = fs.createReadStream(localPath);
  stream.pipe(res);

  stream.on('close', function() {
    try { fs.unlinkSync(localPath); } catch (e) { /* already gone */ }
  });
});

module.exports = router;
