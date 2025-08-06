// index.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const zipCenters = {
  "91901": { lat: 32.813624, lng: -116.726969 },
  "91902": { lat: 32.67479, lng: -117.00475 },
  "91905": { lat: 32.678648, lng: -116.307485 },
  "91906": { lat: 32.658049, lng: -116.476042 },
  "91910": { lat: 32.63653, lng: -117.06301 },
  "91911": { lat: 32.60686, lng: -117.04984 },
  "91913": { lat: 32.62174, lng: -116.98609 },
  "91914": { lat: 32.66604, lng: -116.95426 },
  "91915": { lat: 32.62266, lng: -116.95013 },
  "91916": { lat: 32.911035, lng: -116.632006 },
  "91917": { lat: 32.612788, lng: -116.76394 },
  "91931": { lat: 32.837596, lng: -116.580305 },
  "91932": { lat: 32.56923, lng: -117.11798 },
  "91934": { lat: 32.65, lng: -116.2 },
  "91935": { lat: 32.70214, lng: -116.78721 },
  "91941": { lat: 32.7601, lng: -116.9993 },
  "91942": { lat: 32.777267, lng: -117.021344 },
  "91945": { lat: 32.733147, lng: -117.034068 },
  "91948": { lat: 32.87, lng: -116.43 },
  "91950": { lat: 32.66952, lng: -117.09313 },
  "91962": { lat: 32.79248, lng: -116.48044 },
  "91963": { lat: 32.647953, lng: -116.596357 },
  "91977": { lat: 32.72, lng: -117.0 },
  "91978": { lat: 32.698921, lng: -116.930959 },
  "91980": { lat: 32.588097, lng: -116.660845 },
  "92003": { lat: 33.2894, lng: -117.1808 },
  "92004": { lat: 33.2583, lng: -116.3754 },
  "92007": { lat: 33.0214, lng: -117.2831 },
  "92008": { lat: 33.1508, lng: -117.3133 },
  "92009": { lat: 33.0957, lng: -117.244 },
  "92010": { lat: 33.165382, lng: -117.281427 },
  "92011": { lat: 33.106764, lng: -117.296327 },
  "92013": { lat: 33.1, lng: -117.28 },
  "92014": { lat: 32.96, lng: -117.27 },
  "92019": { lat: 32.78, lng: -116.86 },
  "92020": { lat: 32.795605, lng: -116.969754 },
  "92021": { lat: 32.8, lng: -116.9 },
  "92025": { lat: 33.0853, lng: -117.0249 },
  "92026": { lat: 33.2235, lng: -117.1068 },
  "92027": { lat: 33.1387, lng: -116.9893 },
  "92028": { lat: 33.3943, lng: -118.2964 },
  "92029": { lat: 33.0854, lng: -117.1369 },
  "92036": { lat: 33.0666, lng: -116.4739 },
  "92037": { lat: 32.85, lng: -117.27 },
  "92040": { lat: 32.8565, lng: -116.9026 },
  "92049": { lat: 33.19512, lng: -117.37758 },
  "92051": { lat: 33.19953, lng: -117.36802 },
  "92052": { lat: 33.19953, lng: -117.36785 },
  "92054": { lat: 33.19377, lng: -117.35508 },
  "92055": { lat: 33.38123, lng: -117.42874 },
  "92056": { lat: 33.199582, lng: -117.298764 },
  "92057": { lat: 33.25326, lng: -117.28704 },
  "92058": { lat: 33.263974, lng: -117.344777 },
  "92059": { lat: 33.3883, lng: -116.9216 },
  "92060": { lat: 33.4027, lng: -116.7142 },
  "92061": { lat: 33.2947, lng: -116.6846 },
  "92064": { lat: 32.9935, lng: -117.0171 },
  "92065": { lat: 33.0418, lng: -116.8678 },
  "92066": { lat: 33.1153, lng: -116.6039 },
  "92067": { lat: 32.9871, lng: -117.2015 },
  "92069": { lat: 33.17536, lng: -117.15761 },
  "92070": { lat: 33.0739, lng: -116.6213 },
  "92071": { lat: 32.8448, lng: -116.9896 },
  "92075": { lat: 32.9912, lng: -117.2711 },
  "92078": { lat: 33.11834, lng: -117.18554 },
  "92081": { lat: 33.2, lng: -117.24 },
  "92082": { lat: 33.3156, lng: -117.0106 },
  "92083": { lat: 33.2, lng: -117.24 },
  "92084": { lat: 33.2, lng: -117.24 },
  "92085": { lat: 33.2, lng: -117.24 },
  "92086": { lat: 33.3755, lng: -116.8428 },
  "92091": { lat: 32.9989, lng: -117.2014 },
  "92093": { lat: 32.88, lng: -117.24 },
  "92096": { lat: 33.1293, lng: -117.1584 },
  "92101": { lat: 32.7157, lng: -117.1611 },
  "92102": { lat: 32.7173, lng: -117.1263 },
  "92103": { lat: 32.7478, lng: -117.1673 },
  "92104": { lat: 32.7478, lng: -117.1673 },
  "92105": { lat: 32.7173, lng: -117.1263 },
  "92106": { lat: 32.72, lng: -117.25 },
  "92107": { lat: 32.75, lng: -117.26 },
  "92108": { lat: 32.77, lng: -117.17 },
  "92109": { lat: 32.79, lng: -117.25 },
  "92110": { lat: 32.75, lng: -117.19 },
  "92111": { lat: 32.81, lng: -117.19 },
  "92113": { lat: 32.6934, lng: -117.1291 },
  "92114": { lat: 32.6934, lng: -117.1291 },
  "92115": { lat: 32.7605, lng: -117.0796 },
  "92116": { lat: 32.7478, lng: -117.1673 },
  "92117": { lat: 32.89, lng: -117.17 },
  "92118": { lat: 32.67466, lng: -117.16915 },
  "92119": { lat: 32.78, lng: -117.07 },
  "92120": { lat: 32.77, lng: -117.09 },
  "92121": { lat: 32.9, lng: -117.24 },
  "92122": { lat: 32.87, lng: -117.21 },
  "92123": { lat: 32.84, lng: -117.14 },
  "92124": { lat: 32.84, lng: -117.09 },
  "92126": { lat: 32.91, lng: -117.12 },
  "92127": { lat: 33.01913, lng: -117.12339 },
  "92128": { lat: 32.996967, lng: -117.072979 },
  "92129": { lat: 32.96354, lng: -117.12622 },
  "92130": { lat: 32.93, lng: -117.18 },
  "92131": { lat: 32.94, lng: -117.14 },
  "92134": { lat: 32.581, lng: -117.135 },
  "92135": { lat: 32.69487, lng: -117.19461 },
  "92136": { lat: 32.679, lng: -117.1747 },
  "92139": { lat: 32.564, lng: -117.0685 },
  "92140": { lat: 32.771, lng: -117.132 },
  "92145": { lat: 32.883, lng: -117.147 },
  "92154": { lat: 32.578, lng: -116.96621 },
  "92155": { lat: 32.67148, lng: -117.16714 },
  "92161": { lat: 32.8789, lng: -117.237 },
  "92173": { lat: 32.55552, lng: -117.05114 },
  "92182": { lat: 32.8789, lng: -117.237 },
  "92259": { lat: 32.7098, lng: -116.1545 },
  "92536": { lat: 33.3785, lng: -116.7717 },
  "92672": { lat: 33.4306, lng: -117.6157 }
};

const regionToZips = {
  "North Coastal": ["92007", "92008", "92009", "92010", "92011", "92014", "92054", "92055", "92056", "92057", "92058", "92067", "92075", "92081", "92083", "92084", "92091", "92672"],
  "North Inland": ["92003", "92004", "92025", "92026", "92027", "92028", "92029", "92036", "92059", "92060", "92061", "92064", "92065", "92066", "92069", "92070", "92078", "92082", "92086", "92096", "92127", "92128", "92129", "92259", "92536"],
  "North Central": ["92037", "92093", "92106", "92107", "92108", "92109", "92110", "92111", "92117", "92119", "92120", "92121", "92122", "92123", "92124", "92126", "92130", "92131", "92140", "92145", "92161"],
  "East": ["91901", "91905", "91906", "91916", "91917", "91931", "91934", "91935", "91941", "91942", "91945", "91948", "91962", "91963", "91977", "91978", "91980", "92019", "92020", "92021", "92040", "92071"],
  "Central": ["92101", "92102", "92103", "92104", "92105", "92113", "92114", "92115", "92116", "92134", "92136", "92139", "92182"],
  "South": ["91902", "91910", "91911", "91913", "91914", "91915", "91932", "91950", "92118", "92135", "92154", "92155", "92173"]
};

// Log missing ZIP centers
for (const [region, zips] of Object.entries(regionToZips)) {
  zips.forEach(zip => {
    if (!zipCenters[zip]) {
      console.warn(`⚠️ Missing center for ZIP ${zip} in region ${region}`);
    }
  });
}

const radius = 25000;
const GOOGLE_API = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

async function fetchAllPagesForZip(zip, key) {
  const center = zipCenters[zip];
  if (!center) return [];
  const allResults = [];

  let url = GOOGLE_API;
  let params = {
    location: `${center.lat},${center.lng}`,
    radius,
    keyword: "mexican food",
    type: "restaurant",
    key
  };

  let retries = 0;
  do {
    try {
      const response = await axios.get(url, { params });
      const { results, next_page_token } = response.data;
      if (results) allResults.push(...results);
      if (!next_page_token) break;
      retries++;
      await new Promise((res) => setTimeout(res, 2000));
      params.pagetoken = next_page_token;
    } catch (err) {
      console.error(`Error fetching Google Places for ZIP ${zip}:`, err.message);
      break;
    }
  } while (retries < 3);

  return allResults;
}

app.get("/api/google-places", async (req, res) => {
  try {
    const { region = "All" } = req.query;
    const key = process.env.GOOGLE_API_KEY;

    const zips = region === "All"
      ? Object.keys(zipCenters)
      : regionToZips[region] || [];

    const allResults = [];

    for (const zip of zips) {
      const center = zipCenters[zip];
      if (!center) {
        console.warn(`Skipping ZIP ${zip} — no coordinates available`);
        continue;
      }

      try {
        const doc = await db.collection("places").doc(zip).get();
        if (doc.exists) {
          allResults.push(...doc.data().places);
        } else {
          const results = await fetchAllPagesForZip(zip, key);
          await db.collection("places").doc(zip).set({ places: results });
          allResults.push(...results);
        }
      } catch (innerErr) {
        console.error(`Firestore or API error for ZIP ${zip}:`, innerErr.message);
      }
    }

    const deduped = Array.from(new Map(allResults.map(p => [p.place_id, p])).values());
    res.json({ places: deduped });
  } catch (err) {
    console.error("Fatal server error in /api/google-places:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Place this in your Express app setup
app.get("/api/photo", async (req, res) => {
  const { photoRef } = req.query;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!photoRef) {
    return res.status(400).send("Missing photoRef");
  }

  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`;

  try {
    const response = await fetch(photoUrl, { redirect: 'manual' });

    if (response.status === 302) {
      // Google responds with a redirect to the actual image URL
      const imageUrl = response.headers.get("location");
      return res.redirect(imageUrl);
    }

    const text = await response.text();
    console.error("Unexpected response from Google:", text);
    return res.status(500).send("Failed to fetch photo from Google");
  } catch (error) {
    console.error("Photo proxy error:", error);
    return res.status(500).send("Internal server error");
  }
});


app.listen(5001, () => console.log("Proxy running on port 5001"));
