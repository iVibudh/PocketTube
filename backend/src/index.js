const express = require('express');
const cors = require('cors');
require('dotenv').config();

const downloadRouter = require('./routes/download');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/download', downloadRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`PocketTube backend running on port ${PORT}`);
});
