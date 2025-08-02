require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Serve /demo route
app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/demo.html'));
});

app.get('/api/google-places-all', async (req, res) => {
  const { keyword = 'mexican food' } = req.query;

  const centers = [
    { lat: 32.7157, lng: -117.1611 }, // Downtown SD
    { lat: 33.1192, lng: -117.0864 }, // Escondido
    { lat: 32.5521, lng: -117.0452 }, // Chula Vista
    { lat: 32.8336, lng: -116.7664 }, // Alpine
    { lat: 32.7767, lng: -117.0713 }, // Normal Heights
  ];

  const allResults = [];

  await Promise.all(centers.map(async (c) => {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          params: {
            location: `${c.lat},${c.lng}`,
            radius: 50000,
            keyword,
            type: 'restaurant',
            key: process.env.GOOGLE_API_KEY,
          },
        }
      );

      if (response.data.results) {
        response.data.results.forEach(place => {
          const photoRef = place.photos?.[0]?.photo_reference;
          place.photoUrl = photoRef
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${process.env.GOOGLE_PHOTO_API_KEY}`
            : null;
          allResults.push(place);
        });
      }
    } catch (err) {
      console.error(`Error from ${c.lat},${c.lng}:`, err.message);
    }
  }));

  // Deduplicate by place_id
  const unique = Object.values(
    allResults.reduce((acc, place) => {
      acc[place.place_id] = place;
      return acc;
    }, {})
  );

  res.json({ results: unique });
});

app.listen(port, () => {
  console.log(`Google Places proxy running on port ${port}`);
});
