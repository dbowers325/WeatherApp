// ==== Global Variables ====
let currentUnit = "imperial";
let lastSearchedCity = "";
let lastLat = null;
let lastLon = null;
let lastCityName = null;

// ==== DOM Elements ====
const searchBox = document.getElementById("searchBox");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const weatherIcon = document.querySelector(".weather-icon");
const toggleBtn = document.querySelector(".toggle-btn");
const suggestionsContainer = document.querySelector(".suggestions");
const forecastContainer = document.getElementById("forecastContainer");

// ==== Fetch Current Weather by City ====
async function checkWeather(city, unit) {
  if (!city) return;
  lastSearchedCity = city;
  document.getElementById("loader").style.display = "block";

  try {
    const response = await fetch(`/.netlify/functions/get-weather?city=${encodeURIComponent(city)}&units=${unit}`);
    if (response.status === 404) {
      showError("City not found.");
      return;
    }

    const data = await response.json();
    displayWeatherData(data, unit);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    showError("Error fetching data.");
  } finally {
    document.getElementById("loader").style.display = "none";
  }
}

// ==== Fetch Weather by Coordinates ====
async function checkWeatherByCoords(lat, lon, unit, displayName) {
  lastLat = lat;
  lastLon = lon;
  lastCityName = displayName;
  document.getElementById("loader").style.display = "block";

  try {
    const response = await fetch(`/.netlify/functions/get-weather?lat=${lat}&lon=${lon}&units=${unit}`);
    if (response.status === 404) {
      showError("Weather data not found.");
      return;
    }

    const data = await response.json();
    displayWeatherData(data, unit, displayName);
    get5DayForecast(lat, lon, unit);
  } catch (error) {
    console.error("Error fetching weather by coords:", error);
    showError("Error fetching weather data.");
  } finally {
    document.getElementById("loader").style.display = "none";
  }
}

// ==== Display Weather Data ====
function displayWeatherData(data, unit, displayName = null) {
  document.querySelector(".city").innerText = displayName || data.name;
  document.querySelector(".temp").innerText = `${Math.round(data.main.temp)}°${unit === "imperial" ? "F" : "C"}`;
  document.querySelector(".feels-like").innerText = `Feels Like: ${Math.round(data.main.feels_like)}°${unit === "imperial" ? "F" : "C"}`;
  document.querySelector(".humidity").innerText = `${data.main.humidity}%`;
  document.querySelector(".wind").innerText = `${Math.round(data.wind.speed)} ${unit === "imperial" ? "mp/h" : "m/s"}`;

  const condition = data.weather[0].main;
  document.querySelector(".condition-name").innerText = condition;

  const icons = {
    Clouds: "clouds.png",
    Rain: "rain.png",
    Clear: "clear.png",
    Snow: "snow.png",
    Mist: "mist.png",
    Drizzle: "drizzle.png"
  };
  weatherIcon.src = `images/${icons[condition] || "clear.png"}`;

  document.querySelector(".weather").style.display = "block";
  document.querySelector(".error").style.display = "none";
}

// ==== Show Error Message ====
function showError(message) {
  document.querySelector(".weather").style.display = "none";
  document.querySelector(".error").style.display = "block";
  document.querySelector(".error p").innerText = message;
  document.getElementById("loader").style.display = "none";
}

// ==== 5-Day Forecast ====
async function get5DayForecast(lat, lon, unit) {
  try {
    const response = await fetch(`/.netlify/functions/get-forecast?lat=${lat}&lon=${lon}&units=${unit}`);
    const data = await response.json();

    const forecastContainer = document.getElementById("forecastContainer");
    forecastContainer.innerHTML = ""; // Clear previous forecast

    const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    dailyForecasts.forEach(forecast => {
      const date = new Date(forecast.dt_txt).toDateString();
      const temp = Math.round(forecast.main.temp);
      const icon = forecast.weather[0].icon;
      const description = forecast.weather[0].description;

      const card = document.createElement("div");
      card.className = "forecast-day";
      card.innerHTML = `
        <h4>${date}</h4>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
        <p>${temp}°${unit === "imperial" ? "F" : "C"}</p>
        <p>${description}</p>
      `;
      forecastContainer.appendChild(card);
    });

    document.querySelector('.forecast-container').style.display = 'block';

  } catch (error) {
    console.error("Error fetching 5-day forecast:", error);
    forecastContainer.innerHTML = "<p>Unable to load forecast.</p>";
  }
}

// ==== Show Suggestions ====
function showSuggestionList(suggestions) {
  suggestionsContainer.innerHTML = "";
  suggestions.forEach(loc => {
    const name = `${loc.name}${loc.state ? ", " + loc.state : ""}, ${loc.country}`;
    const item = document.createElement("div");
    item.textContent = name;
    item.classList.add("suggestion-item"); //

    item.addEventListener("click", () => {
      suggestionsContainer.style.display = "none";
      searchBox.value = name;
      checkWeatherByCoords(loc.lat, loc.lon, currentUnit, name);
    });

    suggestionsContainer.appendChild(item);
  });
  suggestionsContainer.style.display = "block";
}

// ==== Event Listeners ====

// Search Button Click
searchBtn.addEventListener("click", async () => {
  const cityQuery = searchBox.value.trim();
  if (!cityQuery) return;

  try {
    const response = await fetch(`/.netlify/functions/get-geocode?city=${encodeURIComponent(cityQuery)}`);
    const locations = await response.json();

    if (!locations.length) {
      showError("City not found. Please check spelling or try another name.");
      return;
    }

    if (locations.length === 1) {
      const { lat, lon, name, state, country } = locations[0];
      const displayName = `${name}${state ? ", " + state : ""}, ${country}`;
      checkWeatherByCoords(lat, lon, currentUnit, displayName);
    } else {
      showSuggestionList(locations);
    }
  } catch (err) {
    console.error("Geocoding error:", err);
    showError("Error searching for city.");
  }
});

// Location Button Click
locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        searchBox.value = "";
        checkWeatherByCoords(latitude, longitude, currentUnit);
      },
      () => alert("Unable to retrieve your location.")
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});

// Unit Toggle Button
toggleBtn.addEventListener("click", () => {
  currentUnit = currentUnit === "imperial" ? "metric" : "imperial";
  toggleBtn.innerText = currentUnit === "imperial" ? "Switch to Metric" : "Switch to Imperial";
  if (lastLat !== null && lastLon !== null) {
    checkWeatherByCoords(lastLat, lastLon, currentUnit, lastCityName);
  } else if (lastSearchedCity) {
    checkWeather(lastSearchedCity, currentUnit);
  }
});

// Load Initial Weather on Page Load
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        checkWeatherByCoords(latitude, longitude, currentUnit);
      },
      () => console.warn("Geolocation denied or unavailable.")
    );
  }

  // Hide suggestions when clicking outside
  document.addEventListener("click", e => {
    if (!searchBox.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.style.display = "none";
    }
  });
});

// Enter key triggers search
searchBox.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});
