const admin = require('../utils/firebase');

const FREE_PLAN_FILE_LIMIT = 10;  // max files stored on free plan
const PRO_DAILY_LIMIT = 10;       // max new downloads per day on pro plan

/**
 * Checks the user's plan before allowing a download.
 *
 * Free plan  → blocks if the user already has 10+ docs in users/{uid}/media
 * Pro plan   → blocks if the user has already downloaded 10+ times today
 *
 * Reads from:
 *   users/{uid}/meta/plan   → { type: 'free' | 'pro', purchasedAt: Timestamp }
 *   users/{uid}/meta/stats  → { downloadsToday: number, lastDownloadDate: 'YYYY-MM-DD', totalDownloads: number }
 */
async function checkPlan(req, res, next) {
  const userId = req.uid;
  const db = admin.firestore();

  try {
    const planDoc = await db.doc(`users/${userId}/meta/plan`).get();
    const plan = planDoc.exists ? planDoc.data() : { type: 'free' };
    req.userPlan = plan;

    if (plan.type === 'free') {
      // Count how many media docs the user currently has
      const mediaSnap = await db.collection(`users/${userId}/media`).count().get();
      const count = mediaSnap.data().count;

      if (count >= FREE_PLAN_FILE_LIMIT) {
        return res.status(403).json({
          error: `Free plan limit reached. You can store up to ${FREE_PLAN_FILE_LIMIT} files. Delete some files or upgrade to Pro.`,
          code: 'FREE_LIMIT_REACHED',
          currentCount: count,
          limit: FREE_PLAN_FILE_LIMIT
        });
      }
    } else if (plan.type === 'pro') {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const statsDoc = await db.doc(`users/${userId}/meta/stats`).get();
      const stats = statsDoc.exists
        ? statsDoc.data()
        : { downloadsToday: 0, lastDownloadDate: '' };

      if (stats.lastDownloadDate === today && stats.downloadsToday >= PRO_DAILY_LIMIT) {
        return res.status(403).json({
          error: `Daily download limit reached. Pro users can download up to ${PRO_DAILY_LIMIT} files per day.`,
          code: 'PRO_DAILY_LIMIT_REACHED',
          downloadsToday: stats.downloadsToday,
          limit: PRO_DAILY_LIMIT
        });
      }
    }

    next();
  } catch (err) {
    // Fail open — don't block downloads if Firestore is temporarily unavailable
    console.error('Plan check error (failing open):', err);
    next();
  }
}

/**
 * Records a completed download in users/{uid}/meta/stats.
 * Called after a successful upload so the counter only increments on success.
 */
async function recordDownload(userId) {
  const db = admin.firestore();
  const today = new Date().toISOString().slice(0, 10);
  const statsRef = db.doc(`users/${userId}/meta/stats`);

  try {
    const statsDoc = await statsRef.get();
    const stats = statsDoc.exists
      ? statsDoc.data()
      : { downloadsToday: 0, lastDownloadDate: '', totalDownloads: 0 };

    await statsRef.set({
      downloadsToday: stats.lastDownloadDate === today ? stats.downloadsToday + 1 : 1,
      lastDownloadDate: today,
      totalDownloads: (stats.totalDownloads || 0) + 1
    });
  } catch (err) {
    console.error('Failed to record download stats:', err);
  }
}

module.exports = { checkPlan, recordDownload };
