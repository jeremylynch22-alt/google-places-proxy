require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Health check route
app.get('/', (req, res) => {
  res.send('✅ Google Places Proxy is running');
});

// Single-point nearby search
app.get('/api/google-places', async (req, res) => {
  const { lat, lng, keyword } = req.query;

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${lat},${lng}`,
          radius: 15000, // Extended radius
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

// Multi-point search for entire San Diego County
app.get('/api/google-places-all', async (req, res) => {
  const { keyword = 'mexican food' } = req.query;

  const centers = [
    { lat: 32.7157, lng: -117.1611 },   // Downtown San Diego
    { lat: 33.1192, lng: -117.0864 },   // North County (Escondido)
    { lat: 32.5521, lng: -117.0452 },   // South Bay (Chula Vista)
    { lat: 32.8336, lng: -116.7664 },   // East County (Alpine)
    { lat: 32.7767, lng: -117.0713 },   // Mid-City (San Diego State)
  ];

  const allResults = [];

  for (const c of centers) {
    let pagetoken = '';
    let pages = 0;

    do {
      const params = {
        location: `${c.lat},${c.lng}`,
        radius: 50000, // Max radius allowed
        keyword,
        type: 'restaurant',
        key: process.env.GOOGLE_API_KEY,
      };
      if (pagetoken) params.pagetoken = pagetoken;

      try {
        const resp = await axios.get(
          'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
          { params }
        );

        const data = resp.data;
        if (data.results) allResults.push(...data.results);
        pagetoken = data.next_page_token;
        pages++;

        // Wait before fetching next page
        if (pagetoken) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (error) {
        console.error(`Error at ${c.lat},${c.lng}:`, error.message);
        break;
      }
    } while (pagetoken && pages < 3);
  }

  // Deduplicate by place_id
  const uniqueResults = Object.values(
    allResults.reduce((acc, place) => {
      acc[place.place_id] = place;
      return acc;
    }, {})
  );

  res.json({ results: uniqueResults });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Google Places proxy running on port ${PORT}`));
