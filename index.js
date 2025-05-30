const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const basicAuth = require('basic-auth');
const db = require('./db'); // database connection

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Basic Auth Middleware
const auth = function (req, res, next) {
  const user = basicAuth(req);
  const validUser = 'admin';
  const validPass = 'mySecret123'; // ← change this to your secure password

  if (!user || user.name !== validUser || user.pass !== validPass) {
    res.set('WWW-Authenticate', 'Basic realm="GeoPal Map"');
    return res.status(401).send('Authentication required.');
  }
  next();
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));  // serve static files (index.html, etc.)

// 🔐 Secure map page
app.get('/', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔐 Secure job data
app.get('/jobs', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM jobs').all();
  res.json(rows);
});

// 🚀 Webhook for GeoPal Data Exchange (open access)
app.post('/geopal-hook', (req, res) => {
  console.log("📦 Full incoming payload from GeoPal:\n", JSON.stringify(req.body, null, 2));
  const job = req.body.job;
  const project = job?.project;

  if (!job || !job.identifier) {
    console.log('❌ Missing job or identifier field');
    return res.status(400).send('Missing job.identifier');
  }

  const lat = parseFloat(project?.address_lat);
  const lng = parseFloat(project?.address_lng);

  if (!isFinite(lat) || !isFinite(lng)) {
    console.log(`⚠️ Job ${job.identifier} skipped: invalid or missing coordinates.`);
    return res.status(200).send('Ignored: no lat/lng');
  }

  const jobEntry = {
    id: job.identifier,
    lat,
    lng,
    address: project?.address || 'No address provided',
    status: job.job_status_id || 'Unknown',
    completed_at: job.updated_on || 'Unknown',
    inspector: job.employee ? `${job.employee.first_name} ${job.employee.last_name}` : 'Unknown'
  };

  // Save to database if not already present
  const insert = db.prepare(`
    INSERT OR IGNORE INTO jobs (id, lat, lng, address, status, completed_at, inspector)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    jobEntry.id,
    jobEntry.lat,
    jobEntry.lng,
    jobEntry.address,
    jobEntry.status,
    jobEntry.completed_at,
    jobEntry.inspector
  );

  console.log(`✅ Stored job ${jobEntry.id} in database`);
  res.status(200).send('OK');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
