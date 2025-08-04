require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const centers = {
  North: { lat: 33.1581, lng: -117.3506 },
  East: { lat: 32.8300, lng: -116.9800 },
  Central: { lat: 32.7157, lng: -117.1611 },
  South: { lat: 32.5922, lng: -117.0306 },
  West: { lat: 32.7500, lng: -117.2500 },
};

const radius = 20000; // 20km
const PER_PAGE = 20;

app.get("/api/google-places", async (req, res) => {
  const { region = "All", page = 1 } = req.query;
  const browserKey = process.env.GOOGLE_PHOTO_API_KEY;
  const apiKey = process.env.GOOGLE_API_KEY;

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
            key: apiKey,
          },
        }
      );
      allResults.push(...response.data.results);
    }

    // Deduplicate
    const uniqueResults = Array.from(
      new Map(allResults.map((p) => [p.place_id, p])).values()
    );

    const formatted = uniqueResults.map((place) => {
      let photoUrl = "https://via.placeholder.com/400x300?text=No+Image";
      if (place.photos?.[0]?.photo_reference) {
        const ref = place.photos[0].photo_reference;
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${ref}&key=${browserKey}`;
      }

      return {
        place_id: place.place_id,
        name: place.name,
        rating: place.rating,
        jerberto_rating: null,
        photoUrl,
        address: place.vicinity || "Address Not Available",
        geometry: place.geometry,
      };
    });

    // Manual pagination
    const totalPages = Math.ceil(formatted.length / PER_PAGE);
    const paginated = formatted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    res.json({ places: paginated, totalPages });
  } catch (err) {
    console.error("API error:", err.message);
    res.status(500).send("Error fetching Google Places data");
  }
});

app.get("/env.js", (req, res) => {
  res.set("Content-Type", "application/javascript");
  res.send(`
    window.FIREBASE_API_KEY = "${process.env.FIREBASE_API_KEY}";
    window.FIREBASE_AUTH_DOMAIN = "${process.env.FIREBASE_AUTH_DOMAIN}";
    window.FIREBASE_PROJECT_ID = "${process.env.FIREBASE_PROJECT_ID}";
    window.GOOGLE_MAPS_API_KEY = "${process.env.GOOGLE_API_KEY}";
  `);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "demo.html"));
});

app.listen(5001, () => console.log("Proxy server running on port 5001"));
