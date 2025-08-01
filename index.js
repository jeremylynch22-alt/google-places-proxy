// index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/google-places', async (req, res) => {
  const { lat, lng, keyword } = req.query;

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${lat},${lng}`,
          radius: 5000,
          keyword: keyword || 'mexican food',
          type: 'restaurant',
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error fetching Google Places data');
  }
});

app.listen(5001, '0.0.0.0', () => {
  console.log('Google Places proxy running on http://0.0.0.0:5001');
});
