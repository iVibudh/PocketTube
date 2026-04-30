const { randomUUID } = require('crypto');

// In-memory job store — fine for single-instance Cloud Run personal use.
// Jobs are cleaned up after 1 hour to prevent memory leaks.
const jobs = new Map();

function createJob() {
  const id = randomUUID();
  jobs.set(id, {
    id,
    status: 'pending',   // pending | downloading | uploading | done | error
    progress: 0,         // 0–100
    result: null,        // populated when status === 'done'
    error: null,         // populated when status === 'error'
    createdAt: Date.now()
  });
  return id;
}

function updateJob(id, updates) {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, updates);
}

function getJob(id) {
  return jobs.get(id) || null;
}

// Clean up jobs older than 1 hour every 15 minutes
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}, 15 * 60 * 1000).unref(); // .unref() so this timer doesn't keep the process alive

module.exports = { createJob, updateJob, getJob };
