// index.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const centers = {
  Carlsbad:        { lat: 33.16, lng: -117.34 },
  ChulaVista:      { lat: 32.64, lng: -117.08 },
  Coronado:        { lat: 32.69, lng: -117.18 },
  DelMar:          { lat: 32.96, lng: -117.27 },
  ElCajon:         { lat: 32.77886, lng: -116.87142 },
  Encinitas:       { lat: 33.04, lng: -117.29 },
  Escondido:       { lat: 33.1192068, lng: -117.086421 },
  Fallbrook:       { lat: 33.3764, -117.2511 }, 
  ImperialBeach:   { lat: 32.58, lng: -117.11 },
  LaMesa:          { lat: 32.75964, lng: -116.99253 },
  LemonGrove:      { lat: 32.733451, lng: -117.033702 },
  NationalCity:    { lat: 32.6781, lng: -117.0992 },
  Oceanside:       { lat: 33.2, lng: -117.38 },
  Poway:           { lat: 32.96, lng: -117.04 },
  Rancho Bernardo: { lat: 33.0336, -117.0806 },
  SanDiego:        { lat: 32.72, lng: -117.16 },
  SanMarcos:       { lat: 33.14, lng: -117.17 },
  Santee:          { lat: 32.84, lng: -116.97 },
  SolanaBeach:     { lat: 32.991155, lng: -117.2711481 },
  Vista:           { lat: 33.2143717, lng: -117.2088167 }
};

const radius = 35000; // 35km for better coverage
const PER_PAGE = 20;

app.get("/api/google-places", async (req, res) => {
  const { region = "All", page = 1 } = req.query;
  const browserKey = process.env.GOOGLE_PHOTO_API_KEY;

  const locations =
    region === "All" ? Object.values(centers) : [centers[region]];
  const allResults = [];

  try {
    for (const loc of locations) {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        {
          params: {
            location: `${loc.lat},${loc.lng}`,
            radius,
            keyword: "mexican food",
            type: "restaurant",
            key: process.env.GOOGLE_API_KEY,
          },
        }
      );
      allResults.push(...response.data.results);
    }

    // Deduplicate results by place_id
    const uniqueResults = Array.from(
      new Map(allResults.map((place) => [place.place_id, place])).values()
    );

    // Format data
    const formatted = uniqueResults.map((place) => {
      let photoUrl = "https://via.placeholder.com/400x300?text=No+Image";
      if (place.photos && place.photos.length > 0) {
        const ref = place.photos[0].photo_reference;
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${ref}&key=${browserKey}`;
      }

      return {
        place_id: place.place_id,
        name: place.name,
        rating: place.rating,
        jerberto_rating: null, // Placeholder for DB lookup
        photoUrl,
        geometry: place.geometry,
        address: place.vicinity || "Address not available"
      };
    });

    // Pagination
    const totalPages = Math.ceil(formatted.length / PER_PAGE);
    const paginated = formatted.slice(
      (page - 1) * PER_PAGE,
      page * PER_PAGE
    );

    res.json({ places: paginated, totalPages });
  } catch (err) {
    console.error("API error:", err.message);
    res.status(500).send("Error fetching Google Places data");
  }
});

// Serve frontend-safe Firebase & Google Maps keys
app.get("/env.js", (req, res) => {
  res.set("Content-Type", "application/javascript");
  res.send(`
    window.FIREBASE_API_KEY = "${process.env.FIREBASE_API_KEY}";
    window.FIREBASE_AUTH_DOMAIN = "${process.env.FIREBASE_AUTH_DOMAIN}";
    window.FIREBASE_PROJECT_ID = "${process.env.FIREBASE_PROJECT_ID}";
    window.GOOGLE_MAPS_API_KEY = "${process.env.GOOGLE_API_KEY}";
  `);
});

// Fallback route for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "demo.html"));
});

app.listen(5001, () => console.log("Proxy server running on port 5001"));
