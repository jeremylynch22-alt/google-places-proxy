const express = require("express");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5001;

// Firebase setup
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
});
const db = getFirestore();

app.use(express.static("public"));

const regionToZips = require("./regionToZips");
const zipCenters = require("./zipCenters");

app.get("/api/google-places", async (req, res) => {
  const region = req.query.region || "All";
  let places = [];
  let zips = region === "All" ? Object.values(regionToZips).flat() : regionToZips[region] || [];

  for (const zip of zips) {
    const center = zipCenters[zip];
    if (!center) continue;

    // Check Firestore for cached places
    const docRef = db.collection("places").doc(zip);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      if (data && data.places) {
        console.log(`✔️ Using cached data for ZIP ${zip}`);
        places.push(...data.places);
        continue;
      }
    }

    console.log(`🌐 Fetching from Google for ZIP ${zip}`);
    let zipPlaces = [];
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${process.env.GOOGLE_API_KEY}&location=${center.lat},${center.lng}&radius=1500&type=restaurant&keyword=mexican`;

    while (url) {
      const response = await fetch(url);
      const json = await response.json();

      if (json.results) zipPlaces.push(...json.results);
      url = json.next_page_token ? `${url}&pagetoken=${json.next_page_token}` : null;
      if (url) await new Promise((r) => setTimeout(r, 2000)); // Wait for token to activate
    }

    // Save to Firestore
    await docRef.set({ places: zipPlaces, timestamp: Date.now() });
    places.push(...zipPlaces);
  }

  res.json({ places });
});


// Photo proxy
app.get("/api/photo", async (req, res) => {
  const ref = req.query.photoRef;
  if (!ref) return res.status(400).send("Missing photoRef");
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${ref}&key=${process.env.GOOGLE_API_KEY}`;
  const response = await fetch(url);
  response.body.pipe(res);
});

// Fetch video from Firestore by place_id
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
    console.error("Firestore error:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => console.log(`Proxy running on port ${port}`));
