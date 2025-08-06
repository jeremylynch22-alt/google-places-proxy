const express = require("express");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5001;

// Initialize Firebase Admin with Firestore
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
});
const db = admin.firestore();

app.use(express.static("public"));

// Local ZIP/Region maps
const regionToZips = require("./regionToZips");
const zipCenters = require("./zipCenters");

// Google Places API - main fetch with caching
app.get("/api/google-places", async (req, res) => {
  const region = req.query.region || "All";
  let places = [];

  const zips = region === "All"
    ? Object.values(regionToZips).flat()
    : regionToZips[region] || [];

  for (const zip of zips) {
    const center = zipCenters[zip];
    if (!center) {
      console.warn(`⚠️ Missing center for ZIP ${zip} in region ${region}`);
      continue;
    }

    try {
      // Try fetching cached data
      const docRef = db.collection("places").doc(zip);
      const doc = await docRef.get();

      if (doc.exists) {
        console.log(`✅ Using cached places for ZIP ${zip}`);
        places.push(...doc.data().places);
        continue;
      }

      console.log(`⏳ Fetching from Google for ZIP ${zip}...`);
      let results = [];
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${process.env.GOOGLE_API_KEY}&location=${center.lat},${center.lng}&radius=1500&type=restaurant&keyword=mexican`;

      while (url) {
        const response = await fetch(url);
        const json = await response.json();

        if (json.results) {
          results.push(...json.results);
        }

        if (json.next_page_token) {
          await new Promise((r) => setTimeout(r, 2000)); // Delay for token to activate
          url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${process.env.GOOGLE_API_KEY}&pagetoken=${json.next_page_token}`;
        } else {
          url = null;
        }
      }

      // Cache in Firestore
      await docRef.set({ places: results });
      places.push(...results);

    } catch (err) {
      console.error(`Firestore or API error for ZIP ${zip}:`, err.message);
    }
  }

  if (places.length === 0) {
    return res.status(500).json({ error: "No places returned from API." });
  }

  res.json({ places });
});

// Proxy photo requests from Google
app.get("/api/photo", async (req, res) => {
  const ref = req.query.photoRef;
  if (!ref) return res.status(400).send("Missing photoRef");

  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${ref}&key=${process.env.GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    response.body.pipe(res);
  } catch (err) {
    console.error("Photo proxy error:", err.message);
    res.status(500).send("Failed to load photo");
  }
});

// Fetch video URL from Firestore for a place
app.get("/api/video", async (req, res) => {
  const placeId = req.query.place_id;
  if (!placeId) return res.status(400).send("Missing place_id");

  try {
    const snapshot = await db.collection("videos").where("place_id", "==", placeId).get();
    if (snapshot.empty) return res.status(404).json({});

    const doc = snapshot.docs[0];
    const data = doc.data();
    res.json({ video_url: data.video_url });
  } catch (err) {
    console.error("Firestore error:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => console.log(`✅ Proxy running on port ${port}`));
