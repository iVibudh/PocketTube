const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

if (!admin.apps.length) {
  const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');

  admin.initializeApp({
    credential: fs.existsSync(serviceAccountPath)
      ? admin.credential.cert(serviceAccountPath)
      : admin.credential.applicationDefault(),
    storageBucket: process.env.FIREBASE_BUCKET
  });
}

module.exports = admin;
