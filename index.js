const express = require("express");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
const cors = require("cors");
const zipCenters = require("./zipCenters");
const regionToZips = require("./regionToZips");

const app = express();
app.use(cors());
app.use(express.static("public"));


const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) throw new Error("Missing GOOGLE_API_KEY");

const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJSON) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT");

const serviceAccount = JSON.parse(serviceAccountJSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

app.get("/api/google-places", async (req, res) => {
  const region = req.query.region || "All";
  const zips = region === "All" ? Object.keys(zipCenters) : regionToZips[region] || [];

  const places = [];

  try {
    for (const zip of zips) {
      const cacheDoc = await db.collection("places").doc(zip).get();
      if (cacheDoc.exists) {
        places.push(...(cacheDoc.data().places || []));
        continue;
      }

      const { lat, lng } = zipCenters[zip];
      const radius = 8000;

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=mexican&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results || !Array.isArray(data.results)) {
        console.warn(`Unexpected response for ZIP ${zip}:`, data);
        continue;
      }

      const formatted = data.results.map((place) => ({
        name: place.name,
        rating: place.rating,
        address: place.vicinity || place.formatted_address,
        photoRef: place.photos?.[0]?.photo_reference,
        location: place.geometry?.location,
        jerbertoRating: null,
        videoUrl: null,
      }));

      places.push(...formatted);

      await db.collection("places").doc(zip).set({ places: formatted });
    }

    res.json({ places });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.get("/api/photo", async (req, res) => {
  const ref = req.query.ref;
  if (!ref) return res.status(400).send("Missing photo reference");

  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
  try {
    const response = await fetch(photoUrl);
    const buffer = await response.buffer();
    res.set("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch (err) {
    console.error("Photo fetch error:", err);
    res.status(500).send("Error retrieving photo");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
