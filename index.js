require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const BROWSER_SAFE_API_KEY = process.env.GOOGLE_PHOTO_API_KEY;

const centers = [
  { lat: 33.2023, lng: -117.2425, name: 'North' },
  { lat: 32.8265, lng: -116.8672, name: 'East' },
  { lat: 32.7765, lng: -117.0713, name: 'Central' },
  { lat: 32.5772, lng: -117.0491, name: 'South' },
  { lat: 32.7503, lng: -117.2489, name: 'West' },
];

app.get('/demo', (req, res) => {
  const filePath = path.join(__dirname, 'public/demo.html');
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) {
      res.status(500).send('Failed to load demo.html');
    } else {
      const updated = html.replace(/GOOGLE_MAPS_API_KEY_HERE/g, BROWSER_SAFE_API_KEY);
      res.send(updated);
    }
  });
});

app.get('/api/google-places-all', async (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '50');
  const countOnly = req.query.countOnly === 'true';
  const allResults = [];
  const regionCounts = {};

  try {
    for (const center of centers) {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          params: {
            location: `${center.lat},${center.lng}`,
            radius: 10000,
            keyword: 'mexican food',
            type: 'restaurant',
            key: GOOGLE_API_KEY,
          },
        }
      );

      const results = response.data.results.map(place => {
        const photoUrl = place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${BROWSER_SAFE_API_KEY}`
          : null;

        return {
          ...place,
          photoUrl,
          cityCenter: center.name,
        };
      });

      regionCounts[center.name] = results.length;
      if (!countOnly) allResults.push(...results);
    }

    if (countOnly) {
      return res.json({ regionCounts });
    }

    const total = allResults.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = allResults.slice(start, end);

    res.json({
      results: paginated,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Error fetching places:', err.message);
    res.status(500).send('Error fetching data from Google Places API');
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
