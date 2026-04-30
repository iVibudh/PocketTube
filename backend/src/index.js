const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Firebase Admin (Auth only) before any routes load
require('./utils/firebase');

const { verifyToken } = require('./middleware/auth');
const { checkPlan }   = require('./middleware/planCheck');

const infoRouter     = require('./routes/info');
const downloadRouter = require('./routes/download');
const statusRouter   = require('./routes/status');
const fileRouter     = require('./routes/file');

const app = express();
app.use(cors());
app.use(express.json());

// Public
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// All /api/* routes require a valid Firebase ID token
app.use('/api', verifyToken);

app.use('/api/info',     infoRouter);                // POST  - get video metadata
app.use('/api/download', checkPlan, downloadRouter); // POST  - start async download job
app.use('/api/status',   statusRouter);              // GET   - poll job progress
app.use('/api/file',     fileRouter);                // GET   - stream completed file to device

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('PocketTube backend running on port ' + PORT);
});
