/**
 * Plan enforcement is handled client-side (mobile app) to avoid any
 * Firestore reads/writes on the backend server.
 *
 * Free plan (<=10 stored files)   -- enforced in the mobile Library screen
 * Pro plan  (<=10 downloads/day)  -- enforced in the mobile Download screen
 *
 * This file is kept as a placeholder so index.js wiring does not need to
 * change when server-side enforcement is added in a future release.
 */
function checkPlan(req, res, next) {
  next();
}

module.exports = { checkPlan };
