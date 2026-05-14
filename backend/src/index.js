const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// ── Startup env-var validation ────────────────────────────────────────────────
// Fail fast in production. In local dev we fall back to the service-account
// JSON file, so the check is skipped there to keep the dev workflow smooth.
const hasServiceAccountFile = (() => {
  try {
    require('fs').accessSync(
      require('path').resolve(__dirname, '../firebase-service-account.json')
    );
    return true;
  } catch (_) { return false; }
})();

if (!process.env.FIREBASE_SERVICE_ACCOUNT && !hasServiceAccountFile) {
  console.error(
    '[startup] FATAL: FIREBASE_SERVICE_ACCOUNT env var is not set and no ' +
    'local service account file found. Exiting.'
  );
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

const app = express();

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet());

// ── Rate limiting — 30 requests per 15 minutes per IP on all /api/* routes ───
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again in 15 minutes.' },
});

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Request logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Public health check ───────────────────────────────────────────────────────
// Returns only { status: 'ok' } — no version, env, or dependency info.
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Protected API routes ──────────────────────────────────────────────────────
app.use('/api', apiLimiter);     // rate-limit before auth check
app.use('/api', verifyToken);    // all /api/* require a valid Firebase ID token

app.use('/api/info',     infoRouter);                // POST  — get video metadata
app.use('/api/download', checkPlan, downloadRouter); // POST  — start async download job
app.use('/api/status',   statusRouter);              // GET   — poll job progress
app.use('/api/file',     fileRouter);                // GET   — stream completed file

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`PocketTube backend running on port ${PORT}`);
});
