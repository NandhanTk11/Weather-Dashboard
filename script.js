// Import API key from config.js
import config from './config.js';
const apikey = config.apiKey;

// Constants
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const DEFAULT_CITY = 'Dubai';

// DOM Elements
const weatherElements = {
  icon: document.getElementById("weather-icon"),
  location: document.getElementById("city-name"),
  temperature: document.getElementById("temperature"),
  condition: document.getElementById("condition"),
  message: document.getElementById("caption"),
  dayDisplay: document.getElementById("day-display")
};

const controls = {
  searchInput: document.getElementById("cityInput"),
  searchBtn: document.getElementById("searchBtn"),
  prevDayBtn: document.getElementById("prevDayBtn"),
  nextDayBtn: document.getElementById("nextDayBtn")
};

// Travel Page Elements
const travelElements = {
  searchBtn: document.getElementById("travelSearchBtn"),
  input: document.getElementById("travelCityInput"),
  message: document.getElementById("travelMessage")
};

// State
let forecastData = null;
let currentDayIndex = 0;

/**
 * Get user's current location
 */
async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => reject(new Error('Unable to get location'))
    );
  });
}

/**
 * Group forecast data by day
 */
function groupByDay(list) {
  const daily = {};
  list.forEach(entry => {
    const date = entry.dt_txt.split(" ")[0];
    if (!daily[date]) daily[date] = [];
    daily[date].push(entry);
  });
  return daily;
}

/**
 * Display weather for currentDayIndex
 */
function displayWeather() {
  if (!forecastData) return;

  const dailyData = groupByDay(forecastData.list);
  const days = Object.keys(dailyData);
  const todayData = dailyData[days[currentDayIndex]];
  if (!todayData) return;

  // Navigation button states
  controls.prevDayBtn.disabled = currentDayIndex === 0;
  controls.nextDayBtn.disabled = currentDayIndex === days.length - 1;

  controls.prevDayBtn.style.opacity = currentDayIndex === 0 ? '0.5' : '1';
  controls.nextDayBtn.style.opacity = currentDayIndex === days.length - 1 ? '0.5' : '1';

  // Update day label
  if (currentDayIndex === 0) {
    weatherElements.dayDisplay.textContent = "Today's Weather";
  } else {
    const date = new Date(days[currentDayIndex]);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    weatherElements.dayDisplay.textContent = `${dayName}'s Weather`;
  }

  // Pick midday forecast (or fallback first entry)
  const weatherData = todayData[Math.floor(todayData.length / 2)] || todayData[0];
  const { main, weather } = weatherData;
  const condition = weather[0].main;
  const icon = weather[0].icon;

  const isDay = icon.includes("d");

  // Update UI
  weatherElements.icon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  weatherElements.location.textContent = forecastData.city.name;
  weatherElements.temperature.textContent = `${Math.round(main.temp)}°C`;
  weatherElements.condition.textContent = condition;

  // Custom messages
  let message = "";
  switch (condition) {
    case "Clear":
      message = isDay ? "☀ Sunny day, wear sunglasses!" : "🌙 Clear night sky, enjoy the stars!";
      break;
    case "Clouds":
      message = isDay ? "☁ Partly cloudy." : "☁🌙 Cloudy night sky.";
      break;
    case "Rain":
      message = isDay ? "🌧 Rainy day, bring an umbrella!" : "🌧🌙 Rainy night, drive safe!";
      break;
    case "Drizzle":
      message = "🌦 Light drizzle outside.";
      break;
    case "Thunderstorm":
      message = "⛈ Stormy weather, best to stay indoors.";
      break;
    case "Snow":
      message = "❄ Snowy conditions, dress warmly!";
      break;
    case "Mist":
    case "Fog":
    case "Haze":
    case "Smoke":
    case "Dust":
      message = "🌫 Low visibility, travel carefully.";
      break;
    default:
      message = "ℹ Stay prepared for changing weather!";
  }

  weatherElements.message.textContent = message;
}

/**
 * Fetch weather forecast by city
 */
async function fetchWeather(city) {
  try {
    weatherElements.message.textContent = 'Loading...';

    const response = await fetch(
      `${WEATHER_API_BASE_URL}/forecast?q=${city}&appid=${apikey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(response.status === 404 ? 'City not found!' : 'Failed to fetch weather');
    }

    forecastData = await response.json();
    currentDayIndex = 0;
    displayWeather(); // <-- caption now comes from here only
  } catch (err) {
    weatherElements.message.textContent = err.message;
    console.error(err);
  }
}

/**
 * Initialize weather app
 */
async function initWeather() {
  try {
    weatherElements.message.textContent = 'Detecting your location...';
    const loc = await getCurrentLocation();

    const res = await fetch(
      `${WEATHER_API_BASE_URL}/weather?lat=${loc.lat}&lon=${loc.lon}&appid=${apikey}`
    );
    const data = await res.json();
    fetchWeather(data.name);
  } catch (err) {
    console.warn("Using default city:", err);
    fetchWeather(DEFAULT_CITY);
  }
}

// Event listeners
controls.searchBtn.addEventListener("click", () => {
  const city = controls.searchInput.value.trim();
  if (city) fetchWeather(city);
});

controls.searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") controls.searchBtn.click();
});

controls.prevDayBtn.addEventListener("click", () => {
  if (currentDayIndex > 0) {
    currentDayIndex--;
    displayWeather();
  }
});

controls.nextDayBtn.addEventListener("click", () => {
  const days = Object.keys(groupByDay(forecastData.list));
  if (currentDayIndex < days.length - 1) {
    currentDayIndex++;
    displayWeather();
  }
});

// --- Travel Page Logic ---
if (travelElements.searchBtn && travelElements.input && travelElements.message) {
  async function checkTravel(city) {
    try {
      console.log(`Fetching weather for: ${city}`);
      const response = await fetch(
        `${WEATHER_API_BASE_URL}/weather?q=${city}&appid=${apikey}&units=metric`
      );

      if (!response.ok) {
        travelElements.message.innerHTML = "❌ City not found! Please try again.";
        return;
      }

      const data = await response.json();
      console.log("API Response:", data);
      const condition = data.weather[0].main;
      const temp = Math.round(data.main.temp);
      const icon = data.weather[0].icon;

      let suggestion = "";
      switch (condition) {
        case "Rain":
        case "Drizzle":
        case "Thunderstorm":
          suggestion = `🌧 Too rainy in ${city}, consider planning another day.`;
          break;
        case "Snow":
          suggestion = `❄ Snowy in ${city}, maybe good for winter sports!`;
          break;
        case "Clear":
          suggestion = `☀ Clear weather in ${city}, perfect for travel!`;
          break;
        case "Clouds":
          suggestion = `☁ Cloudy in ${city}, still fine for travel.`;
          break;
        default:
          suggestion = `ℹ Weather in ${city}: ${condition}. Plan accordingly.`;
      }

      travelElements.message.innerHTML = `
        <div style="text-align:center;">
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${condition}">
          <p><strong>${city}</strong></p>
          <p>🌡 ${temp}°C | ${condition}</p>
          <p>${suggestion}</p>
        </div>
      `;
    } catch (error) {
      travelElements.message.textContent = "⚠ Error fetching weather data";
      console.error(error);
    }
  }

  // Button click
  travelElements.searchBtn.addEventListener("click", () => {
    const city = travelElements.input.value.trim();
    if (city) checkTravel(city);
  });


  // Enter key
  travelElements.input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") travelElements.searchBtn.click();
  });
}

// Run app on load
window.addEventListener("load", initWeather);
