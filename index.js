app.post("/webhook", (req, res) => {
  const { job } = req.body;

  // Ensure job and identifier exist
  if (!job || !job.identifier) {
    return res.status(400).send("Invalid job data");
  }

  // Extract map-relevant data
  const jobId = job.identifier;
  const lat = job.project?.address_lat;
  const lng = job.project?.address_lng;

  // Optional fallback if GPS is embedded in workflow
  // const gpsStep = job.job_workflows?.find(wf => wf.name.includes("GPS Coordinates"));
  // const coords = gpsStep?.action_value_entered?.split(" ");
  // const lat = coords?.[0];
  // const lng = coords?.[1];

  const mapData = {
    id: jobId,
    lat,
    lng,
    status: job.job_status_id,
    completed_at: job.updated_on,
    inspector: `${job.employee?.first_name} ${job.employee?.last_name}`
  };

  console.log("Received job data:", mapData);

  // Save to database or memory or emit to frontend
  // For now, just respond with success
  res.status(200).send("Job received");
});
