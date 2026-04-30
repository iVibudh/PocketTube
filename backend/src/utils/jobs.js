const { randomUUID } = require('crypto');
const fs = require('fs');

// In-memory job store -- fine for single-instance Cloud Run personal use.
const jobs = new Map();

function createJob() {
  var id = randomUUID();
  jobs.set(id, {
    id:        id,
    status:    'pending',
    progress:  0,
    result:    null,
    error:     null,
    createdAt: Date.now()
  });
  return id;
}

function updateJob(id, updates) {
  var job = jobs.get(id);
  if (!job) return;
  Object.assign(job, updates);
}

function getJob(id) {
  return jobs.get(id) || null;
}

// Clean up jobs older than 1 hour every 15 minutes.
// Also deletes any leftover temp file that was never fetched.
setInterval(function() {
  var cutoff = Date.now() - 60 * 60 * 1000;
  for (var entry of jobs.entries()) {
    var id  = entry[0];
    var job = entry[1];
    if (job.createdAt < cutoff) {
      if (job.result && job.result.localPath) {
        try { fs.unlinkSync(job.result.localPath); } catch (e) { /* already gone */ }
      }
      jobs.delete(id);
    }
  }
}, 15 * 60 * 1000).unref();

module.exports = { createJob, updateJob, getJob };
