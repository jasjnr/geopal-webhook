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
  const validPass = 'mySecret123'; // ← Change this

  if (!user || user.name !== validUser || user.pass !== validPass) {
    res.set('WWW-Authenticate', 'Basic realm="GeoPal Map"');
    return res.status(401).send('Authentication required.');
  }
  next();
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));  // Serve map files (e.g., index.html)

// 🔐 Map page
app.get('/', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔐 Job data
app.get('/jobs', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM jobs').all();
  res.json(rows);
});

// 🚀 GeoPal Webhook
app.post('/geopal-hook', (req, res) => {
  const job = req.body.job;
  const workflows = job?.job_workflows || [];
  const jobFieldFiles = job?.job_field_files || [];
  const statusMessages = jobFieldFiles[0]?.job_status_change_messages || [];

  // Extract GPS from workflow (e.g., Jobfield_4 or name with "GPS")
  let lat, lng;
  const gpsStep = workflows.find(wf =>
    wf.name.includes('GPS') || wf.name === 'Jobfield_4'
  );

  if (gpsStep?.action_value_entered) {
    const coords = gpsStep.action_value_entered.trim().split(' ');
    lat = parseFloat(coords[0]);
    lng = parseFloat(coords[1]);
  }

  // Debug log for skipped jobs
  if (!job?.identifier || !isFinite(lat) || !isFinite(lng)) {
    console.log(`⚠️ Skipped job:
  - identifier: ${job?.identifier}
  - lat: ${lat}
  - lng: ${lng}
  - raw GPS step: ${gpsStep?.action_value_entered}
  `);
    return res.status(200).send('Invalid job payload');
  }

  // Extract inspector from job field HTML ("By: X" inside message)
  let inspector = 'Unassigned';
  if (statusMessages.length > 0) {
    const htmlMessage = statusMessages[0].message;
    const match = htmlMessage.match(/<strong>By:<\/strong>\s*([^<]+)/);
    if (match && match[1]) {
      inspector = match[1].trim();
    }
  }

  const jobEntry = {
    id: job.identifier,
    lat,
    lng,
    address: job?.project?.address || 'Unknown',
    status: job.job_status_id || 'Unknown',
    completed_at: job.updated_on || 'Unknown',
    inspector
  };

  // Save to DB
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

  console.log(`✅ Stored job ${jobEntry.id} by ${inspector} at [${lat}, ${lng}]`);
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
