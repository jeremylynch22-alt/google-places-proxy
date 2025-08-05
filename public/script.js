// public/script.js
const regionSelect = document.getElementById("region");
const resultsContainer = document.getElementById("results");
const loader = document.getElementById("loader");

async function fetchAndRender(region = "All") {
  resultsContainer.innerHTML = "";
  loader.style.display = "block";

  try {
    const response = await fetch(`/api/google-places?region=${region}`);
    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      throw new Error("No places returned from API.");
    }

    data.places.forEach(place => {
      const card = document.createElement("div");
      card.className = "place-card";

      // Construct photo URL
      let photoUrl = "https://via.placeholder.com/400x200?text=No+Image";
      if (place.photos && place.photos.length > 0) {
        const ref = place.photos[0].photo_reference;
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
      }

      card.innerHTML = `
        <img class="place-photo" src="${photoUrl}" alt="${place.name}">
        <div class="place-info">
          <h3>${place.name}</h3>
          <p>${place.vicinity || "No address available"}</p>
          <p>Rating: ${place.rating || "N/A"} (${place.user_ratings_total || 0} reviews)</p>
        </div>
      `;

      resultsContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to fetch places:", err.message);
    resultsContainer.innerHTML = `<p style="color: red;">⚠️ Failed to load results: ${err.message}</p>`;
  } finally {
    loader.style.display = "none";
  }
}

regionSelect.addEventListener("change", () => {
  fetchAndRender(regionSelect.value);
});

fetchAndRender(); // Initial load
