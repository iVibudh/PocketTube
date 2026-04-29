const express = require('express');
const router = express.Router();
const path = require('path');
const { downloadMedia } = require('../utils/ytdlp');
const { uploadFile } = require('../utils/storage');

router.post('/', async (req, res) => {
  const { url, format, userId, filename } = req.body;

  if (!url || !format || !userId) {
    return res.status(400).json({ error: 'url, format, userId required' });
  }
  if (!['audio', 'video'].includes(format)) {
    return res.status(400).json({ error: 'format must be audio or video' });
  }

  try {
    console.log(`Downloading ${format} from ${url} for user ${userId}`);
    const localPath = await downloadMedia(url, format);
    const fname = filename || path.basename(localPath);
    const { url: downloadUrl, destination } = await uploadFile(localPath, userId, fname);
    res.json({ success: true, url: downloadUrl, path: destination });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
