const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

/**
 * Firebase Admin -- Auth only.
 * The backend uses Firebase exclusively to verify the user ID token on each
 * request (see middleware/auth.js). No Firestore or Storage is used server-side.
 */
if (!admin.apps.length) {
  var serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
  admin.initializeApp({
    credential: fs.existsSync(serviceAccountPath)
      ? admin.credential.cert(serviceAccountPath)
      : admin.credential.applicationDefault()
  });
}

module.exports = admin;
