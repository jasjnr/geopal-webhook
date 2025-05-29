const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

let jobData = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));  // serve static files

// Serve the map page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Return job data
app.get('/jobs', (req, res) => {
  res.json(jobData);
});

// Handle GeoPal webhook
app.post('/geopal-hook', (req, res) => {
  const job = req.body.job || {};
  if (job.lat && job.lng) {
    jobData.push({
      id: job.id,
      lat: job.lat,
      lng: job.lng,
      address: job.address || 'Unknown location',
      status: job.status || 'Unknown',
    });
    console.log(`📍 New job received: ${job.address}`);
  } else {
    console.log('❗ No lat/lng data found in job');
  }
  res.status(200).send('Received');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
