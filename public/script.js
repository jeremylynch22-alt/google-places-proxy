document.addEventListener("DOMContentLoaded", () => {
  const regionSelect = document.getElementById("region");
  const loadingDiv = document.getElementById("loading");
  const resultsDiv = document.getElementById("results");

  async function fetchAndRender() {
    const region = regionSelect.value;
    loadingDiv.classList.remove("hidden");
    resultsDiv.innerHTML = "";

    try {
      const response = await fetch(`/api/google-places?region=${region}`);
      const data = await response.json();

      if (!data.places || data.places.length === 0) {
        resultsDiv.innerHTML = "<p>No places found.</p>";
        return;
      }

      data.places.forEach((place) => {
        const card = document.createElement("div");
        card.className = "card";

        const photoRef = place.photos?.[0]?.photo_reference;
        const photoUrl = photoRef
          ? `/api/photo?photoRef=${photoRef}`
          : "https://via.placeholder.com/400x200?text=No+Image";

        card.innerHTML = `
          <img src="${photoUrl}" alt="${place.name}" />
          <h2>${place.name}</h2>
          <p><strong>Jerberto's Rating:</strong> ${
            Math.round((place.rating || 0) * 20) / 20
          } ⭐</p>
          <p><strong>Google Rating:</strong> ${place.rating || "N/A"} (${
          place.user_ratings_total || 0
        } reviews)</p>
          <p><strong>Address:</strong> ${place.vicinity}</p>
        `;

        resultsDiv.appendChild(card);
      });
    } catch (err) {
      console.error("Failed to fetch places:", err);
      resultsDiv.innerHTML = "<p>Error loading places.</p>";
    } finally {
      loadingDiv.classList.add("hidden");
    }
  }

  regionSelect.addEventListener("change", fetchAndRender);
  fetchAndRender();
});
