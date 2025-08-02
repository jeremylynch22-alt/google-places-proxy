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
const fs = require('fs');
app.get('/demo', (req, res) => {
  const filePath = path.join(__dirname, 'public/demo.html');

  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) {
      res.status(500).send('Failed to load demo.html');
    } else {
      const updated = html.replace(/GOOGLE_MAPS_API_KEY_HERE/g, process.env.GOOGLE_PHOTO_API_KEY);
      res.send(updated);
    }
  });
});

app.get('/api/google-places-all', async (req, res) => {
  const { keyword = 'mexican food', page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const centers = [
    { lat: 32.7157, lng: -117.1611 },
    { lat: 33.1192, lng: -117.0864 },
    { lat: 32.5521, lng: -117.0452 },
    { lat: 32.8336, lng: -116.7664 },
    { lat: 32.7767, lng: -117.0713 },
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

  const total = unique.length;
  const start = (pageNum - 1) * limitNum;
  const paginated = unique.slice(start, start + limitNum);

  res.json({
    results: paginated,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

app.listen(port, () => {
  console.log(`Google Places proxy running on port ${port}`);
});
