app.post('/geopal-hook', (req, res) => {
  const job = req.body.job;

  if (!job) {
    console.log('❌ No "job" object found in the webhook.');
    return res.status(400).send('Missing job data.');
  }

  const id = job.id || 'Unknown';
  const address = job.address || 'No address';
  const status = job.status || 'Unknown';
  const lat = parseFloat(job.lat);
  const lng = parseFloat(job.lng);

  if (!isFinite(lat) || !isFinite(lng)) {
    console.log(`⚠️ Job ${id} skipped: invalid coordinates.`);
    return res.status(200).send('Ignored: no location');
  }

  const jobEntry = { id, address, status, lat, lng };

  // Check for duplicates (optional)
  const exists = jobData.find(j => j.id === id);
  if (!exists) {
    jobData.push(jobEntry);
    console.log(`📍 Job ${id} saved: ${address} [${lat}, ${lng}]`);
  }

  res.status(200).send('Received');
});
