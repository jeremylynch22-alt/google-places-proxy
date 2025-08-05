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
  "92007": { lat: 33.0214, lng: -117.2831 },
  "92008": { lat: 33.1508, lng: -117.3133 },
  "92009": { lat: 33.0957, lng: -117.244 },
  "92010": { lat: 33.1654, lng: -117.2814 },
  "92011": { lat: 33.1068, lng: -117.2963 },
  "92014": { lat: 32.96, lng: -117.27 },
  "92025": { lat: 33.0853, lng: -117.0249 },
  "92026": { lat: 33.2235, lng: -117.1068 },
  "92027": { lat: 33.1387, lng: -116.9893 },
  "92028": { lat: 33.3943, lng: -118.2964 },
  "92029": { lat: 33.0854, lng: -117.1369 },
  "92054": { lat: 33.1938, lng: -117.3551 },
  "92055": { lat: 33.3812, lng: -117.4287 },
  "92056": { lat: 33.1996, lng: -117.2988 },
  "92057": { lat: 33.2533, lng: -117.287 },
  "92058": { lat: 33.264, lng: -117.3448 },
  "92064": { lat: 32.9935, lng: -117.0171 },
  "92065": { lat: 33.0418, lng: -116.8678 },
  "92069": { lat: 33.1754, lng: -117.1576 },
  "92070": { lat: 33.0739, lng: -116.6213 },
  "92078": { lat: 33.1183, lng: -117.1855 },
  "92081": { lat: 33.2, lng: -117.24 },
  "92083": { lat: 33.2, lng: -117.24 },
  "92084": { lat: 33.2, lng: -117.24 },
  "92091": { lat: 32.9989, lng: -117.2014 },
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
  "92118": { lat: 32.6747, lng: -117.1692 },
  "92120": { lat: 32.77, lng: -117.09 },
  "92121": { lat: 32.9, lng: -117.24 },
  "92122": { lat: 32.87, lng: -117.21 },
  "92123": { lat: 32.84, lng: -117.14 },
  "92124": { lat: 32.84, lng: -117.09 },
  "92126": { lat: 32.91, lng: -117.12 },
  "92127": { lat: 33.0191, lng: -117.1234 },
  "92128": { lat: 32.997, lng: -117.073 },
  "92129": { lat: 32.9635, lng: -117.1262 },
  "92130": { lat: 32.93, lng: -117.18 },
  "92131": { lat: 32.94, lng: -117.14 },
  "92134": { lat: 32.581, lng: -117.135 },
  "92135": { lat: 32.6949, lng: -117.1946 },
  "92136": { lat: 32.679, lng: -117.1747 },
  "92139": { lat: 32.564, lng: -117.0685 },
  "92140": { lat: 32.771, lng: -117.132 },
  "92145": { lat: 32.883, lng: -117.147 },
  "92154": { lat: 32.578, lng: -116.9662 },
  "92155": { lat: 32.6715, lng: -117.1671 },
  "92161": { lat: 32.8789, lng: -117.237 },
  "92173": { lat: 32.5555, lng: -117.0511 }
};

const regionToZips = {
  "North Coastal": ["92007", "92008", "92009", "92010", "92011", "92014", "92054", "92055", "92056", "92057", "92058", "92067", "92075", "92081", "92083", "92084", "92091", "92672"],
  "North Inland": ["92003", "92004", "92025", "92026", "92027", "92028", "92029", "92036", "92059", "92060", "92061", "92064", "92065", "92066", "92069", "92070", "92078", "92082", "92086", "92096", "92127", "92128", "92129", "92259", "92536"],
  "North Central": ["92037", "92093", "92106", "92107", "92108", "92109", "92110", "92111", "92117", "92119", "92120", "92121", "92122", "92123", "92124", "92126", "92130", "92131", "92140", "92145", "92161"],
  "East": ["91901", "91905", "91906", "91916", "91917", "91931", "91934", "91935", "91941", "91942", "91945", "91948", "91962", "91963", "91977", "91978", "91980", "92019", "92020", "92021", "92040", "92071"],
  "Central": ["92101", "92102", "92103", "92104", "92105", "92113", "92114", "92115", "92116", "92134", "92136", "92139", "92182"],
  "South": ["91902", "91910", "91911", "91913", "91914", "91915", "91932", "91950", "92118", "92135", "92154", "92155", "92173"]
};

const radius = 1500;
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
    const response = await axios.get(url, { params });
    const { results, next_page_token } = response.data;
    allResults.push(...results);
    if (!next_page_token) break;
    retries++;
    await new Promise((res) => setTimeout(res, 2000));
    params.pagetoken = next_page_token;
  } while (retries < 3);

  return allResults;
}

app.get("/api/google-places", async (req, res) => {
  const { region = "All" } = req.query;
  const key = process.env.GOOGLE_API_KEY;

  const zips = region === "All"
    ? Object.keys(zipCenters)
    : regionToZips[region] || [];

  const allResults = [];

  for (const zip of zips) {
    const doc = await db.collection("places").doc(zip).get();
    if (doc.exists) {
      allResults.push(...doc.data().places);
    } else {
      const results = await fetchAllPagesForZip(zip, key);
      await db.collection("places").doc(zip).set({ places: results });
      allResults.push(...results);
    }
  }

  const deduped = Array.from(new Map(allResults.map(p => [p.place_id, p])).values());
  res.json({ places: deduped });
});

app.listen(5001, () => console.log("Proxy running on port 5001"));