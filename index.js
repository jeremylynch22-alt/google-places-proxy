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

// City centers to search (now include name for filtering)
const centers = [
  { lat: 33.1959, lng: -117.3795, name: 'North' },       // Oceanside area
  { lat: 32.6401, lng: -116.9196, name: 'East' },        // Jamul area
  { lat: 32.7157, lng: -117.1611, name: 'Central' },     // Downtown San Diego
  { lat: 32.6401, lng: -117.0842, name: 'South' },       // San Ysidro / Chula Vista
  { lat: 32.7555, lng: -117.2414, name: 'West' },        // Ocean Beach / Point Loma
];

// Serve dynamic demo.html with key injection
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

// API for frontend to use all aggregated places with pagination
app.get('/api/google-places-all', async (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '50');
  const allResults = [];

  try {
    for (const center of centers) {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          params: {
            location: `${center.lat},${center.lng}`,
            radius: 15000, // 10km radius
            keyword: 'mexican food',
            type: 'restaurant',
            key: GOOGLE_API_KEY,
          },
        }
      );

      const enhanced = response.data.results.map(place => {
        const photoUrl = place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${BROWSER_SAFE_API_KEY}`
          : null;

        return {
          ...place,
          photoUrl,
          cityCenter: center.name,
        };
      });

      allResults.push(...enhanced);
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

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
