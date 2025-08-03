// script.js

const API_BASE = "/api/google-places";

let currentPage = 1;
let selectedRegion = "";
let minRating = 0;
let searchName = "";

async function fetchResults(page = 1) {
  showLoader();
  const url = new URL(API_BASE, window.location.origin);
  url.searchParams.append("page", page);
  if (selectedRegion) url.searchParams.append("region", selectedRegion);
  if (minRating) url.searchParams.append("minRating", minRating);
  if (searchName) url.searchParams.append("name", searchName);

  const res = await fetch(url);
  const data = await res.json();

  renderResults(data.results);
  renderPagination(data.totalPages, page);
  hideLoader();
}

function renderResults(results) {
  const container = document.getElementById("results");
  container.innerHTML = "";
  results.forEach(place => {
    const card = document.createElement("div");
    card.className = "place";
    card.onclick = () => openVideo(place.place_id);

    const image = document.createElement("img");
    image.src = place.photoUrl || "https://via.placeholder.com/300x160?text=No+Image";
    card.appendChild(image);

    const name = document.createElement("div");
    name.className = "place-name";
    name.textContent = place.name;
    card.appendChild(name);

    const jerberto = document.createElement("div");
    jerberto.className = "jerberto-rating";
    jerberto.textContent = `Jerberto's Rating: ${place.jerberto_rating || "N/A"}`;
    card.appendChild(jerberto);

    const rating = document.createElement("div");
    rating.className = "google-rating";
    rating.textContent = `Google Rating: ${place.rating || "N/A"}`;
    card.appendChild(rating);

    container.appendChild(card);
  });
}

function renderPagination(totalPages, currentPage) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.disabled = i === currentPage;
    btn.onclick = () => {
      currentPage = i;
      fetchResults(i);
    };
    pagination.appendChild(btn);
  }
}

function initControls() {
  const controls = document.getElementById("controls");

  const regionSelect = document.createElement("select");
  regionSelect.innerHTML = `<option value="">All Regions</option>
    <option value="North">North</option>
    <option value="South">South</option>
    <option value="East">East</option>
    <option value="West">West</option>
    <option value="Central">Central</option>`;
  regionSelect.onchange = () => {
    selectedRegion = regionSelect.value;
    fetchResults(1);
  };
  controls.appendChild(regionSelect);

  const ratingInput = document.createElement("input");
  ratingInput.placeholder = "Minimum Rating";
  ratingInput.type = "number";
  ratingInput.min = 0;
  ratingInput.max = 5;
  ratingInput.onchange = () => {
    minRating = ratingInput.value;
    fetchResults(1);
  };
  controls.appendChild(ratingInput);

  const nameInput = document.createElement("input");
  nameInput.placeholder = "Search by name";
  nameInput.oninput = () => {
    searchName = nameInput.value;
    fetchResults(1);
  };
  controls.appendChild(nameInput);

  const toggleView = document.createElement("button");
  toggleView.textContent = "Toggle Map View";
  toggleView.onclick = () => {
    const map = document.getElementById("map");
    const list = document.getElementById("results");
    map.style.display = map.style.display === "none" ? "block" : "none";
    list.style.display = list.style.display === "none" ? "grid" : "none";
  };
  controls.appendChild(toggleView);
}

// Initialize everything
window.addEventListener("DOMContentLoaded", () => {
  initControls();
  fetchResults();
});