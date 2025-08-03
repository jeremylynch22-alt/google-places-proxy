// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Initialize Firebase
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

// Example values — these should be set via the app controls
let selectedCity = "All";
let currentPage = 1;
const perPage = 20;

async function fetchPlaces(city, page = 1) {
  showLoader();
  try {
    const url = new URL("/api/google-places", window.location.origin);
    url.searchParams.append("region", city);
    url.searchParams.append("page", page);

    const response = await fetch(url);
    const data = await response.json();

    renderResults(data.places);
    renderPagination(data.totalPages, page);
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
    const q = query(collection(db, "videos"), where("place_id", "==", place.place_id));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      videoUrl = snapshot.docs[0].data().video_url;
    }

    card.innerHTML = `
      <img src="${place.photoUrl}" alt="Photo of ${place.name}" />
      <div class="place-name">${place.name}</div>
      <div class="jerberto-rating">Jerberto's Rating: ${place.jerberto_rating || "N/A"}</div>
      <div class="google-rating">Google Rating: ${place.rating || "N/A"}</div>
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

// Kick off initial fetch
fetchPlaces(selectedCity, currentPage);