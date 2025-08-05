// script.js

const regionSelect = document.getElementById("region");
const ratingFilter = document.getElementById("ratingFilter");
const nameFilter = document.getElementById("nameFilter");
const cityFilter = document.getElementById("cityFilter");
const placesContainer = document.getElementById("places");
const loading = document.getElementById("loading");

regionSelect.addEventListener("change", fetchAndRender);
ratingFilter.addEventListener("input", renderPlaces);
nameFilter.addEventListener("input", renderPlaces);
cityFilter.addEventListener("input", renderPlaces);

let allPlaces = [];

async function fetchAndRender() {
  const region = regionSelect.value;

  // Show loading animation
  loading.classList.add("show");
  placesContainer.innerHTML = "";

  try {
    const response = await fetch(`/api/google-places?region=${region}`);
    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      throw new Error("No places returned from API.");
    }

    allPlaces = data.places;
    renderPlaces();
  } catch (error) {
    console.error("Failed to fetch places:", error);
    placesContainer.innerHTML = `<p class="error">Failed to load results: ${error.message}</p>`;
  } finally {
    // Hide loading animation
    loading.classList.remove("show");
  }
}

function renderPlaces() {
  const minRating = parseFloat(ratingFilter.value) || 0;
  const nameQuery = nameFilter.value.toLowerCase();
  const cityQuery = cityFilter.value.toLowerCase();

  const filtered = allPlaces.filter((place) => {
    const name = place.name?.toLowerCase() || "";
    const city = place.vicinity?.toLowerCase() || "";
    const rating = parseFloat(place.rating || 0);

    return (
      name.includes(nameQuery) &&
      city.includes(cityQuery) &&
      rating >= minRating
    );
  });

  placesContainer.innerHTML = "";

  filtered.forEach((place) => {
    const card = document.createElement("div");
    card.className = "place-card";

    card.innerHTML = `
      <h3>${place.name}</h3>
      <p><strong>Address:</strong> ${place.vicinity || "N/A"}</p>
      <p><strong>Rating:</strong> ${place.rating || "N/A"}</p>
    `;

    placesContainer.appendChild(card);
  });

  if (filtered.length === 0) {
    placesContainer.innerHTML = `<p class="no-results">No places found matching your filters.</p>`;
  }
}

// Initial load
fetchAndRender();
