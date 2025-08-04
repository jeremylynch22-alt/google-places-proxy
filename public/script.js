// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Initialize Firebase using env.js
const firebaseConfig = {
  apiKey: window.FIREBASE_API_KEY,
  authDomain: window.FIREBASE_AUTH_DOMAIN,
  projectId: window.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const resultsContainer = document.getElementById("results");
const paginationContainer = document.getElementById("pagination");
const loadingSpinner = document.getElementById("loading");
const toggleMapBtn = document.getElementById("toggleMapBtn");
const mapElement = document.getElementById("map");
const cityFilter = document.getElementById("cityFilter");

let selectedCity = "All";
let currentPage = 1;
const perPage = 20;
let isMapView = false;
let map;
let markers = [];

async function fetchPlaces(city, page = 1) {
  showLoader();
  try {
    const url = new URL("/api/google-places", window.location.origin);
    url.searchParams.append("region", city);
    url.searchParams.append("page", page);

    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    if (!data.places) throw new Error("Invalid JSON response: 'places' missing");

    renderResults(data.places);
    renderPagination(data.totalPages, page);
    if (isMapView) renderMap(data.places);
  } catch (err) {
    console.error("Failed to fetch places:", err);
  } finally {
    hideLoader();
  }
}

function renderResults(places) {
  resultsContainer.innerHTML = "";
  places.forEach(async place => {
    const card = document.createElement("div");
    card.className = "place";

    // Get video review if available
    let videoUrl = null;
    try {
      const q = query(collection(db, "videos"), where("place_id", "==", place.place_id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        videoUrl = snapshot.docs[0].data().video_url;
      }
    } catch (err) {
      console.warn("Error fetching video URL for", place.name, err);
    }

    card.innerHTML = `
      <img src="${place.photoUrl}" alt="Photo of ${place.name}" />
      <div class="place-name">${place.name}</div>
      <div class="jerberto-rating">Jerberto's Rating: ${place.jerberto_rating || "N/A"}</div>
      <div class="google-rating">Google Rating: ${place.rating || "N/A"}</div>
      <div class="address">${place.address || "Address not available"}</div>
    `;

    card.addEventListener("click", () => {
      if (videoUrl) {
        window.open(videoUrl, "_blank");
      } else {
        alert("No video review available.");
      }
    });

    resultsContainer.appendChild(card);
  });
}

function renderPagination(totalPages, currentPage) {
  paginationContainer.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.disabled = true;
    btn.addEventListener("click", () => {
      fetchPlaces(selectedCity, i);
    });
    paginationContainer.appendChild(btn);
  }
}

function showLoader() {
  loadingSpinner.classList.add("show");
}
function hideLoader() {
  loadingSpinner.classList.remove("show");
}

// Region filter logic
cityFilter.addEventListener("change", () => {
  selectedCity = cityFilter.value;
  currentPage = 1;
  fetchPlaces(selectedCity, currentPage);
});

// Map toggle logic
toggleMapBtn.addEventListener("click", () => {
  isMapView = !isMapView;
  mapElement.style.display = isMapView ? "block" : "none";
  resultsContainer.style.display = isMapView ? "none" : "grid";
  paginationContainer.style.display = isMapView ? "none" : "block";
  if (isMapView && map && markers.length > 0) {
    google.maps.event.trigger(map, "resize");
    map.setCenter(markers[0].getPosition());
  }
});

function renderMap(places) {
  if (!map) {
    map = new google.maps.Map(mapElement, {
      zoom: 10,
      center: { lat: 32.7157, lng: -117.1611 },
    });
  }

  // Clear markers
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  places.forEach(async place => {
    const position = {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    };

    const marker = new google.maps.Marker({
      position,
      map,
      title: place.name,
    });

    // Get video URL
    let videoUrl = null;
    try {
      const q = query(collection(db, "videos"), where("place_id", "==", place.place_id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        videoUrl = snapshot.docs[0].data().video_url;
      }
    } catch (err) {
      console.warn("Error fetching video URL for", place.name, err);
    }

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div>
          <strong>${place.name}</strong><br/>
          Jerberto’s Rating: ${place.jerberto_rating || "N/A"}<br/>
          Google Rating: ${place.rating || "N/A"}<br/>
          ${videoUrl ? `<a href="${videoUrl}" target="_blank">🎥 Watch Review</a>` : ""}
        </div>
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    markers.push(marker);
  });
}

// Initial fetch
window.addEventListener("DOMContentLoaded", () => {
  fetchPlaces(selectedCity, currentPage);
});