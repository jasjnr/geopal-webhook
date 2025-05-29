const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let jobData = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));  // serve frontend files

// Serve the map
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Return stored jobs
app.get('/jobs', (req, res) => {
  res.json(jobData);
});

// GeoPal webhook endpoint
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
    inspector: job.employee ? `${job.employee.first_name} ${job.employee.last_nam
