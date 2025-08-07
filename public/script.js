// script.js

let map;
let allPlaces = [];
let markers = [];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 9,
    center: { lat: 32.7157, lng: -117.1611 }, // San Diego
  });
}

async function fetchAndRender() {
  const loading = document.getElementById("loading");
  const results = document.getElementById("results");
  const regionEl = document.getElementById("region");
  const ratingEl = document.getElementById("rating");
  const searchEl = document.getElementById("search");

  if (!loading || !results || !regionEl || !ratingEl || !searchEl) return;

  loading.style.display = "block";
  results.innerHTML = "";

  const region = regionEl.value;
  const ratingFilter = parseFloat(ratingEl.value);
  const searchQuery = searchEl.value.toLowerCase();

  try {
    const response = await fetch(`/api/google-places?region=${region}`);
    const places = await response.json();

    if (!places || !Array.isArray(places)) {
      throw new Error("Invalid API response");
    }

    allPlaces = places.filter(
      (place) =>
        (!place.rating || place.rating >= ratingFilter) &&
        (!searchQuery || place.name.toLowerCase().includes(searchQuery))
    );

    renderPlaces();
  } catch (err) {
    console.error("Failed to fetch places:", err);
    results.innerHTML = `<p>Failed to load results: ${err.message}</p>`;
  } finally {
    loading.style.display = "none";
  }
}

function renderPlaces() {
  const results = document.getElementById("results");
  if (!results) return;

  results.innerHTML = "";
  markers.forEach((m) => m.setMap(null));
  markers = [];

  allPlaces.forEach((place) => {
    const card = document.createElement("div");
    card.className = "card";

    const photoUrl = place.photoRef
      ? `/api/photo?ref=${place.photoRef}`
      : "https://via.placeholder.com/150";

    card.innerHTML = `
      <img src="${photoUrl}" alt="${place.name}" />
      <div class="card-body">
        <h3>${place.name}</h3>
        <p>${place.address || "Address unavailable"}</p>
        <p>Google Rating: ${place.rating || "N/A"}</p>
        ${place.jerbertoRating ? `<p>Jerberto's Rating: ${place.jerbertoRating}</p>` : ""}
        ${place.videoUrl ? `<span class="video-icon" onclick="showVideo('${place.videoUrl}')">📹</span>` : ""}
      </div>
    `;

    results.appendChild(card);

    if (map && place.location) {
      const marker = new google.maps.Marker({
        position: place.location,
        map,
        title: place.name,
      });
      markers.push(marker);
    }
  });
}

function showVideo(url) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
      <video controls autoplay>
        <source src="${url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
  `;
  document.body.appendChild(modal);
}

window.addEventListener("DOMContentLoaded", () => {
  const regionEl = document.getElementById("region");
  const ratingEl = document.getElementById("rating");
  const searchEl = document.getElementById("search");
  const toggleViewEl = document.getElementById("toggleView");

  if (regionEl) regionEl.addEventListener("change", fetchAndRender);
  if (ratingEl) ratingEl.addEventListener("change", fetchAndRender);
  if (searchEl) searchEl.addEventListener("input", fetchAndRender);
  if (toggleViewEl) {
    toggleViewEl.addEventListener("click", () => {
      const mapDiv = document.getElementById("map");
      const resultsDiv = document.getElementById("results");
      const isMapVisible = mapDiv && mapDiv.style.display === "block";
      if (mapDiv && resultsDiv) {
        mapDiv.style.display = isMapVisible ? "none" : "block";
        resultsDiv.style.display = isMapVisible ? "grid" : "none";
      }
    });
  }

  fetchAndRender();
});

window.initMap = initMap;