const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// ── Startup env-var validation ────────────────────────────────────────────────
// Fail fast in production. In local dev we fall back to the service account
// JSON file, so the check is skipped there to keep the dev workflow smooth.
const hasServiceAccountFile = (() => {
  try { require('fs').accessSync(require('path').resolve(__dirname, '../firebase-service-account.json')); return true; }
  catch (_) { return false; }
})();
if (!process.env.FIREBASE_SERVICE_ACCOUNT && !hasServiceAccountFile) {
  console.error('[startup] FATAL: FIREBASE_SERVICE_ACCOUNT env var is not set and no local service account file found. Exiting.');
  process.exit(1);
}

// Initialize Firebase Admin (Auth only) before any routes load
require('./utils/firebase');

const { verifyToken } = require('./middleware/auth');
const { checkPlan }   = require('./middleware/planCheck');

const infoRouter     = require('./routes/info');
const downloadRouter = require('./routes/download');
const statusRouter   = require('./routes/status');
const fileRouter     = require('./routes/file');

