const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

/**
 * Firebase Admin -- Auth only.
 * Credential resolution order:
 *   1. FIREBASE_SERVICE_ACCOUNT env var (JSON string) — used on Railway
 *   2. firebase-service-account.json file — used in local dev
 *   3. Application Default Credentials — fallback
 */
if (!admin.apps.length) {
  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Railway: service account stored as base64-encoded JSON env variable
    const raw = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(raw);
    credential = admin.credential.cert(serviceAccount);
  } else {
    const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
    credential = fs.existsSync(serviceAccountPath)
      ? admin.credential.cert(serviceAccountPath)
      : admin.credential.applicationDefault();
  }

  admin.initializeApp({ credential });
}

module.exports = admin;
