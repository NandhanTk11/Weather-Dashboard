// ======== Configuration ========
const BASE_URL = "https://weather-dashboard-iota-six.vercel.app/api";
 // Relative path works locally and after deployment

// ======== Helper Functions ========
function showLoading(show) {
  const icon = document.getElementById("weather-icon");
  const temp = document.getElementById("temperature");
  const condition = document.getElementById("condition");
  const caption = document.getElementById("caption");

  [icon, temp, condition].forEach(el => {
    if (el) el.style.opacity = show ? '0.5' : '1';
  });

  if (caption) caption.textContent = show ? 'Loading...' : caption.textContent;
}

function groupByDay(list) {
  const daily = {};
  list.forEach(entry => {
    const date = entry.dt_txt.split(" ")[0];
    if (!daily[date]) daily[date] = [];
    daily[date].push(entry);
  });
  return daily;
}

function getClosestForecast(forecasts) {
  const now = Date.now() / 1000; // UTC seconds
  return forecasts.reduce((prev, curr) =>
    Math.abs(curr.dt - now) < Math.abs(prev.dt - now) ? curr : prev
  );
}

// ======== WEATHER PAGE ========
if (document.getElementById("weather-icon")) {
  const weatherIcon = document.getElementById("weather-icon");
  const locationElem = document.getElementById("city-name");
  const temperatureElem = document.getElementById("temperature");
  const conditionElem = document.getElementById("condition");
  const messageElem = document.getElementById("caption");
  const dayDisplayElem = document.getElementById("day-display");
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("cityInput");
  const prevDayBtn = document.getElementById("prevDayBtn");
  const nextDayBtn = document.getElementById("nextDayBtn");

  let forecastData = null;
  let currentDayIndex = 0;

  async function fetchWeather(city) {
    try {
      showLoading(true);
      const res = await fetch(`${BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error("Failed to fetch weather data");
      forecastData = await res.json();
      currentDayIndex = 0;
      displayWeather();
    } catch (err) {
      console.error("Weather fetch error:", err);
      if (messageElem) messageElem.textContent = "⚠ Unable to fetch weather. Try again.";
    } finally {
      showLoading(false);
    }
  }

  function displayWeather() {
    if (!forecastData) return;

    const dailyData = groupByDay(forecastData.list);
    const days = Object.keys(dailyData);
    const todayData = dailyData[days[currentDayIndex]];
    if (!todayData) return;

    dayDisplayElem.textContent =
      currentDayIndex === 0
        ? "Today's Weather"
        : `${new Date(days[currentDayIndex]).toLocaleDateString('en-US', { weekday: 'long' })}'s Weather`;

    const weatherData = getClosestForecast(todayData);
    const { main, weather, dt } = weatherData;
    const condition = weather[0].main;
    const icon = weather[0].icon;
    const sunrise = forecastData.city.sunrise;
    const sunset = forecastData.city.sunset;
    const isDay = dt >= sunrise && dt < sunset;

    weatherIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    locationElem.textContent = forecastData.city.name;
    temperatureElem.textContent = `${Math.round(main.temp)}°C`;
    conditionElem.textContent = condition;

    let message = "";
    switch (condition) {
      case "Clear": message = isDay ? "☀ It’s sunny, wear sunglasses!" : "🌙 Clear night sky!";
        break;
      case "Clouds": message = isDay ? "☁ Partly cloudy." : "☁🌙 Cloudy night.";
        break;
      case "Rain": message = isDay ? "🌧 It’s raining!" : "🌧🌙 Rainy night.";
        break;
      case "Drizzle": message = isDay ? "🌦 Light drizzle." : "🌦🌙 Drizzly night.";
        break;
      case "Thunderstorm": message = "⛈ Stormy weather, stay safe!";
        break;
      case "Snow": message = isDay ? "❄ Snowfall, dress warmly!" : "❄🌙 Snowy night.";
        break;
      default: message = "ℹ Weather updates available.";
    }
    messageElem.textContent = message;
  }

  searchBtn.addEventListener("click", () => {
    const city = searchInput.value.trim();
    if (city) fetchWeather(city);
  });

  searchInput.addEventListener("keyup", e => {
    if (e.key === "Enter") searchBtn.click();
  });

  prevDayBtn.addEventListener("click", () => {
    if (!forecastData) return;
    if (currentDayIndex > 0) { currentDayIndex--; displayWeather(); }
  });

  nextDayBtn.addEventListener("click", () => {
    if (!forecastData) return;
    const days = Object.keys(groupByDay(forecastData.list));
    if (currentDayIndex < days.length - 1) { currentDayIndex++; displayWeather(); }
  });

  // Auto-load current location
  window.addEventListener("load", () => {
    if (!navigator.geolocation) { fetchWeather("Dubai"); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`${BASE_URL}/api/weather/coords?lat=${coords.latitude}&lon=${coords.longitude}`);
          if (!res.ok) throw new Error();
          forecastData = await res.json();
          currentDayIndex = 0;
          displayWeather();
        } catch { fetchWeather("Mumbai"); }
      },
      () => fetchWeather("Mumbai")
    );
  });
}

// ======== TRAVEL PAGE ========
if (document.getElementById("travelSearchBtn")) {
  const travelSearchBtn = document.getElementById("travelSearchBtn");
  const travelCityInput = document.getElementById("travelCityInput");
  const travelMessageElem = document.getElementById("travelMessage");

  async function checkTravel(city) {
    try {
      const res = await fetch(`${BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
      if (!res.ok) { travelMessageElem.innerHTML = "❌ City not found!"; return; }
      const data = await res.json();
      const condition = data.list[0].weather[0].main;
      const temp = Math.round(data.list[0].main.temp);
      const icon = data.list[0].weather[0].icon;

      let suggestion = "";
      switch (condition) {
        case "Rain": case "Drizzle": case "Thunderstorm":
          suggestion = `🌧 Too rainy in ${city}, consider another day.`; break;
        case "Snow":
          suggestion = `❄ Snowy in ${city}, perfect for winter sports!`; break;
        case "Clear":
          suggestion = `☀ Clear skies in ${city}, perfect for travel!`; break;
        case "Clouds":
          suggestion = `☁ Cloudy in ${city}, still fine for travel.`; break;
        default:
          suggestion = `ℹ Weather in ${city}: ${condition}.`;
      }

      travelMessageElem.innerHTML = `
        <div style="text-align:center;">
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${condition}">
          <p><strong>${city}</strong></p>
          <p>🌡 ${temp}°C | ${condition}</p>
          <p>${suggestion}</p>
        </div>
      `;
    } catch (err) {
      travelMessageElem.textContent = "⚠ Error fetching weather!";
      console.error(err);
    }
  }

  travelSearchBtn.addEventListener("click", () => {
    const city = travelCityInput.value.trim();
    if (city) checkTravel(city);
  });

  travelCityInput.addEventListener("keyup", e => {
    if (e.key === "Enter") travelSearchBtn.click();
  });
}
