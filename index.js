const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('GeoPal Webhook Server is running!');
});

app.post('/geopal-hook', (req, res) => {
  console.log('📦 GeoPal webhook received:');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('Headers:', req.headers);

  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
