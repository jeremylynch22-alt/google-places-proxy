// public/script.js

const regionSelector = document.getElementById("region");
const placesContainer = document.getElementById("places");
const loadingIndicator = document.getElementById("loading");

async function fetchAndRender(region = "All") {
  loadingIndicator.style.display = "block";
  placesContainer.innerHTML = "";

  try {
    const response = await fetch(`/api/google-places?region=${encodeURIComponent(region)}`);
    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      throw new Error("No places returned from API.");
    }

    renderPlaces(data.places);
  } catch (err) {
    console.error("Failed to fetch places:", err.message);
    placesContainer.innerHTML = `<p class="error">Failed to load results: ${err.message}</p>`;
  } finally {
    loadingIndicator.style.display = "none";
  }
}

function renderPlaces(places) {
  placesContainer.innerHTML = "";
  places.forEach(place => {
    const card = document.createElement("div");
    card.className = "place-card";

    const photoRef = place.photos?.[0]?.photo_reference;
    const photoUrl = photoRef
      ? `/api/photo?ref=${photoRef}`
      : "https://via.placeholder.com/400x300?text=No+Image";

    card.innerHTML = `
      <img src="${photoUrl}" alt="${place.name}" class="place-photo">
      <div class="place-details">
        <h2>${place.name}</h2>
        <p>${place.vicinity || "Address not available"}</p>
        <p>⭐ ${place.rating ?? "N/A"} (${place.user_ratings_total ?? 0} reviews)</p>
      </div>
    `;

    placesContainer.appendChild(card);
  });
}

regionSelector.addEventListener("change", () => {
  const selectedRegion = regionSelector.value;
  fetchAndRender(selectedRegion);
});

window.addEventListener("DOMContentLoaded", () => {
  fetchAndRender("All");
});
