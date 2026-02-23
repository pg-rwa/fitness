const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'StayPicker Travel Agent', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/search', require('./routes/search'));

// Serve frontend in production
const frontendPath = path.join(__dirname, '../frontend/out');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
      if (err) res.status(404).json({ error: 'Not found' });
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n  StayPicker Travel Agent`);
  console.log(`  API:      http://localhost:${PORT}/api/health`);
  console.log(`  Search:   POST http://localhost:${PORT}/api/search`);
  console.log(`  Browse:   http://localhost:${PORT}/api/search/properties\n`);
});

module.exports = app;
