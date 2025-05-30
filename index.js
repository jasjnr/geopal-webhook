const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const basicAuth = require('basic-auth');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

let jobData = [];

// 👤 Basic auth middleware
const auth = function (req, res, next) {
  const user = basicAuth(req);
  const validUser = 'admin';
  const validPass = 'mySecret123';

  if (!user || user.name !== validUser || user.pass !== validPass) {
    res.set('WWW-Authenticate', 'Basic realm="GeoPal Map"');
    return res.status(401).send('Authentication required.');
  }
  next();
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));  // serve frontend files

// 🔐 Secure the map page
app.get('/', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔐 Secure job data
app.get('/jobs', auth, (req, res) => {
  res.json(jobData);
});

// ✅ GeoPal webhook endpoint
app.post('/geopal-hook', (req, res) => {
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

  const exists = jobData.find(j => j.id === jobEntry.id);
  if (!exists) {
    jobData.push(jobEntry);
    console.log(`✅ Stored job ${jobEntry.id} at [${lat}, ${lng}]`);
  }

  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
