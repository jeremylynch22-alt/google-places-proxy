// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const app = initializeApp({
  apiKey: window.FIREBASE_API_KEY,
  authDomain: window.FIREBASE_AUTH_DOMAIN,
  projectId: window.FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

const resultsContainer = document.getElementById("results");
const paginationContainer = document.getElementById("pagination");
const loadingIndicator = document.getElementById("loading");
const cityFilter = document.getElementById("cityFilter");
const toggleMapBtn = document.getElementById("toggleMapBtn");
const mapElement = document.getElementById("map");

let currentPage = 1;
let currentRegion = "All";
let currentData = [];
let totalPages = 1;
let map;
let markers = [];

cityFilter.addEventListener("change", () => {
  currentRegion = cityFilter.value;
  currentPage = 1;
  fetchAndRender();
});

toggleMapBtn.addEventListener("click", () => {
  mapElement.style.display = mapElement.style.display === "none" ? "block" : "none";
  if (mapElement.style.display === "block") {
    setTimeout(renderMap, 200);
  }
});

async function fetchAndRender() {
  loadingIndicator.classList.add("show");
  try {
    const res = await fetch(`/api/google-places?region=${currentRegion}`);
    const json = await res.json();
    currentData = json.places;
    totalPages = Math.ceil(currentData.length / 20);
    renderResults();
    renderPagination();
    if (mapElement.style.display === "block") renderMap();
  } catch (err) {
    console.error("Failed to fetch places:", err);
  } finally {
    loadingIndicator.classList.remove("show");
  }
}

function renderResults() {
  const pageData = currentData.slice((currentPage - 1) * 20, currentPage * 20);
  resultsContainer.innerHTML = pageData
    .map(
      (place) => `
    <div class="place">
      <img src="${place.photoUrl}" alt="${place.name}" />
      <div class="place-name">${place.name}</div>
      <div class="jerberto-rating">Jerberto Rating: ${place.jerberto_rating || "N/A"}</div>
      <div class="google-rating">Google Rating: ${place.rating || "N/A"}</div>
      <div class="place-address">${place.address || "Address Not Available"}</div>
    </div>
  `
    )
    .join("");
}

function renderPagination() {
  paginationContainer.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.disabled = i === currentPage;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderResults();
      if (mapElement.style.display === "block") renderMap();
    });
    paginationContainer.appendChild(btn);
  }
}

function renderMap() {
  if (!map && currentData.length > 0) {
    map = new google.maps.Map(mapElement, {
      center: currentData[0].geometry.location,
      zoom: 10,
    });
  }

  markers.forEach((m) => m.setMap(null));
  markers = [];

  const pageData = currentData.slice((currentPage - 1) * 20, currentPage * 20);

  pageData.forEach((place) => {
    const marker = new google.maps.Marker({
      position: place.geometry.location,
      map,
      title: place.name,
    });

    const info = new google.maps.InfoWindow({
      content: `<strong>${place.name}</strong><br>${place.address || "Address not available"}`,
    });

    marker.addListener("click", () => {
      info.open(map, marker);
    });

    markers.push(marker);
  });
}

fetchAndRender();