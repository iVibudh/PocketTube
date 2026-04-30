const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Firebase Admin before any routes are loaded
require('./utils/firebase');

const { verifyToken } = require('./middleware/auth');
const { checkPlan }   = require('./middleware/planCheck');

const infoRouter     = require('./routes/info');
const downloadRouter = require('./routes/download');
const statusRouter   = require('./routes/status');

const app = express();
app.use(cors());
app.use(express.json());

// ── Public endpoints ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Authenticated API endpoints ───────────────────────────────────────────────
// All /api/* routes require a valid Firebase ID token in Authorization: Bearer <token>
app.use('/api', verifyToken);

// GET video metadata (title, channel, resolutions, thumbnail) — no download
app.use('/api/info', infoRouter);

// POST to start an async download job — also enforces plan limits
app.use('/api/download', checkPlan, downloadRouter);

// GET job progress/result by jobId
app.use('/api/status', statusRouter);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`PocketTube backend running on port ${PORT}`);
});
