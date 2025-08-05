async function fetchAndRender() {
  const loadingDiv = document.getElementById("loading");
  const resultsDiv = document.getElementById("results");

  if (!loadingDiv || !resultsDiv) {
    console.error("Required DOM elements missing");
    return;
  }

  resultsDiv.innerHTML = "";
  loadingDiv.style.display = "block";

  const region = document.getElementById("region").value;
  try {
    const response = await fetch(`/api/google-places?region=${encodeURIComponent(region)}`);
    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      resultsDiv.innerHTML = "<p>No places found for this region.</p>";
      return;
    }

    data.places.forEach(place => {
      const card = document.createElement("div");
      card.className = "card";

      const photoReference = place.photos?.[0]?.photo_reference;
      const imageUrl = photoReference
        ? `/api/photo?ref=${photoReference}`
        : "https://via.placeholder.com/400x200?text=No+Image";

      card.innerHTML = `
        <img src="${imageUrl}" alt="${place.name}" />
        <h3>${place.name}</h3>
        <p>${place.vicinity || "No address available"}</p>
        <p><strong>Rating:</strong> ${place.rating ?? "N/A"}</p>
      `;

      resultsDiv.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to fetch places:", err);
    resultsDiv.innerHTML = "<p>Something went wrong. Try again later.</p>";
  } finally {
    loadingDiv.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("region").addEventListener("change", fetchAndRender);
  fetchAndRender();
});
