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

      for (const place of data.places) {
        const card = document.createElement("div");
        card.className = "card";

        const photoRef = place.photos?.[0]?.photo_reference;
        const photoUrl = photoRef
          ? `/api/photo?photoRef=${photoRef}`
          : "https://via.placeholder.com/400x200?text=No+Image";

        // Fetch video URL from Firestore
        let videoUrl = null;
        try {
          const videoResponse = await fetch(`/api/video?place_id=${place.place_id}`);
          if (videoResponse.ok) {
            const videoData = await videoResponse.json();
            videoUrl = videoData.video_url;
          }
        } catch (e) {
          console.warn("Video fetch failed for", place.name);
        }

        card.innerHTML = `
          <img src="${photoUrl}" alt="${place.name}" />
          <h2>${place.name}</h2>
          <p><strong>Jerberto's Rating:</strong> ${
            Math.round((place.rating || 0) * 20) / 20
          } ⭐</p>
          <p><strong>Google Rating:</strong> ${place.rating || "N/A"} (${place.user_ratings_total || 0} reviews)</p>
          <p><strong>Address:</strong> ${place.vicinity}</p>
          ${videoUrl ? '<button class="video-btn" data-url="' + videoUrl + '">🎥 Watch Video</button>' : ""}
        `;

        resultsDiv.appendChild(card);
      }
    } catch (err) {
      console.error("Failed to fetch places:", err);
      resultsDiv.innerHTML = "<p>Error loading places.</p>";
    } finally {
      loadingDiv.classList.add("hidden");
    }
  }

  regionSelect.addEventListener("change", fetchAndRender);
  fetchAndRender();

  // Modal handling
  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("video-btn")) {
      const url = e.target.getAttribute("data-url");
      const modal = document.createElement("div");
      modal.className = "modal";
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close">&times;</span>
          <iframe src="${url}" frameborder="0" allowfullscreen></iframe>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector(".close").onclick = () => modal.remove();
      modal.onclick = (event) => {
        if (event.target === modal) modal.remove();
      };
    }
  });
});
