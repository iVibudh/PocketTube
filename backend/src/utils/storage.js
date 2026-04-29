const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require('../../firebase-service-account.json')
    ),
    storageBucket: process.env.FIREBASE_BUCKET
  });
}

const bucket = admin.storage().bucket();

async function uploadFile(localPath, userId, filename) {
  const destination = `users/${userId}/${filename}`;
  await bucket.upload(localPath, {
    destination,
    metadata: {
      contentType: filename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4'
    }
  });
  const [url] = await bucket.file(destination).getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  fs.unlinkSync(localPath);
  return { url, destination };
}

module.exports = { uploadFile };
