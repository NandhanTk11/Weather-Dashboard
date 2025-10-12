// ======== Helper Functions ====
function showLoading(show) {
  const icon = document.getElementById("weather-icon");
  const temp = document.getElementById("temperature");
  const condition = document.getElementById("condition");
  const caption = document.getElementById("caption");
  [icon, temp, condition, caption].forEach(el => {
    if (el) el.style.opacity = show ? "0.5" : "1";
  });

  // Only set "Loading..." for caption if show is true and caption exists
  if (caption && show) {
    caption.textContent = "Loading...";
  }
}

function groupByDay(list) {
  const daily = {};
  list.forEach((entry) => {
    const date = entry.dt_txt.split(" ")[0];
    if (!daily[date]) daily[date] = [];
    daily[date].push(entry);
  });
  return daily;
}

function getClosestForecast(forecasts, selectedDate) {
  // Target 12:00 PM UTC, fallback to 15:00 or 9:00
  const targetHours = [12, 15, 9];
  let closest = null;
  let minDiff = Infinity;

  // Log all forecasts for debugging
  console.log("All forecasts for day:", selectedDate, forecasts.map(f => ({
    dt_txt: f.dt_txt,
    hour: new Date(f.dt * 1000).getUTCHours(),
    dt: f.dt,
    isDay: f.weather[0].icon.includes('d')
  })));

  // Try each target hour
  for (const targetHour of targetHours) {
    const targetTime = new Date(`${selectedDate}T${targetHour.toString().padStart(2, '0')}:00:00Z`).getTime() / 1000;
    const candidate = forecasts.reduce((prev, curr) => {
      const diff = Math.abs(curr.dt - targetTime);
      return diff < Math.abs(prev.dt - targetTime) ? curr : prev;
    });
    const diff = Math.abs(candidate.dt - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = candidate;
    }
  }

  // Debug log for selected forecast
  const forecastTime = new Date(closest.dt * 1000).toUTCString();
  const forecastHour = new Date(closest.dt * 1000).getUTCHours();
  console.log("Selected forecast:", {
    dt: closest.dt,
    forecastTimeUTC: forecastTime,
    forecastHourUTC: forecastHour,
    temp: closest.main.temp,
    condition: closest.weather[0].main,
    icon: closest.weather[0].icon,
    isDay: closest.weather[0].icon.includes('d')
  });

  return closest;
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

  function displayWeather() {
    if (!forecastData || !messageElem) {
      console.error("displayWeather: forecastData or messageElem missing", { forecastData, messageElem });
      return;
    }

    const dailyData = groupByDay(forecastData.list);
    const days = Object.keys(dailyData);
    const todayData = dailyData[days[currentDayIndex]];
    if (!todayData) {
      console.error("displayWeather: No data for selected day", { currentDayIndex, days });
      return;
    }

    if (currentDayIndex === 0) {
      dayDisplayElem.textContent = "Today's Weather";
    } else {
      const date = new Date(days[currentDayIndex]);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      dayDisplayElem.textContent = `${dayName}'s Weather`;
    }

    const selectedDate = days[currentDayIndex];
    const weatherData = getClosestForecast(todayData, selectedDate);
    const { main, weather } = weatherData;
    const condition = weather[0].main || "Unknown";
    const icon = weather[0].icon || "01d";

    const isDay = icon.includes('d');

    weatherIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    locationElem.textContent = forecastData.city.name || "Unknown City";
    temperatureElem.textContent = `${Math.round(main.temp)}°C`;
    conditionElem.textContent = condition;

    let message = "";
    switch (condition) {
      case "Clear":
        message = isDay ? "☀ It’s sunny, wear sunglasses!" : "🌙 Clear night sky, enjoy the stars!";
        break;
      case "Clouds":
        message = isDay ? "☁ Partly cloudy, still bright outside." : "☁🌙 Cloudy night, moon might be hidden.";
        break;
      case "Rain":
        message = isDay ? "🌧 It’s raining, don’t forget your umbrella!" : "🌧🌙 Rainy night, drive safe!";
        break;
      case "Drizzle":
        message = isDay ? "🌦 Light drizzle, maybe carry an umbrella." : "🌦🌙 Drizzly night, roads may be slippery.";
        break;
      case "Thunderstorm":
        message = "⛈ Stormy weather, better stay inside.";
        break;
      case "Snow":
        message = isDay ? "❄ Snowfall, dress warmly!" : "❄🌙 Snowy night, roads may freeze.";
        break;
      default:
        message = `ℹ Weather in ${forecastData.city.name}: ${condition}. Plan accordingly.`;
    }

    messageElem.textContent = message;
  }

  async function fetchWeather(city, lat, lon) {
    try {
      showLoading(true);
      let url;
      if (city) {
        url = `/.netlify/functions/getForecast?city=${encodeURIComponent(city)}`;
      } else {
        url = `/.netlify/functions/getForecast?lat=${lat}&lon=${lon}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch weather data');

      forecastData = await response.json();
      currentDayIndex = 0;
      displayWeather();
    } catch (error) {
      console.error("Weather fetch error:", error);
      if (messageElem) messageElem.textContent = "⚠ Unable to fetch weather. Try again.";
    } finally {
      showLoading(false);
    }
  }

  searchBtn.addEventListener("click", () => {
    const city = searchInput.value.trim();
    if (city) fetchWeather(city);
  });

  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") searchBtn.click();
  });

  prevDayBtn.addEventListener("click", () => {
    if (!forecastData) return;
    const dailyData = groupByDay(forecastData.list);
    if (currentDayIndex > 0) {
      currentDayIndex--;
      displayWeather();
    }
  });

  nextDayBtn.addEventListener("click", () => {
    if (!forecastData) return;
    const dailyData = groupByDay(forecastData.list);
    const days = Object.keys(dailyData);
    if (currentDayIndex < days.length - 1) {
      currentDayIndex++;
      displayWeather();
    }
  });

  window.addEventListener("load", () => {
    if (!navigator.geolocation) {
      fetchWeather("Dubai");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await fetchWeather(null, latitude, longitude);
        } catch {
          fetchWeather("Mumbai");
        }
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
      const response = await fetch(`/.netlify/functions/getCurrentWeather?city=${encodeURIComponent(city)}`);
      if (!response.ok) {
        travelMessageElem.innerHTML = "❌ City not found! Please try again.";
        return;
      }

      const data = await response.json();
      const condition = data.weather[0].main;
      const temp = Math.round(data.main.temp);
      const icon = data.weather[0].icon;

      let suggestion = "";
      switch (condition) {
        case "Rain":
        case "Drizzle":
        case "Thunderstorm":
          suggestion = `🌧 Too rainy in ${city}, consider another day.`;
          break;
        case "Snow":
          suggestion = `❄ Snowy in ${city}, perfect for winter sports!`;
          break;
        case "Clear":
          suggestion = `☀ Clear skies in ${city}, perfect for travel!`;
          break;
        case "Clouds":
          suggestion = `☁ Cloudy in ${city}, still fine for travel.`;
          break;
        default:
          suggestion = `ℹ Weather in ${city}: ${condition}. Plan accordingly.`;
      }

      travelMessageElem.innerHTML = `
        <div style="text-align:center;">
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${condition}">
          <p><strong>${city}</strong></p>
          <p>🌡 ${temp}°C | ${condition}</p>
          <p>${suggestion}</p>
        </div>
      `;
    } catch (error) {
      travelMessageElem.textContent = "⚠ Error fetching weather data!";
      console.error(error);
    }
  }

  travelSearchBtn.addEventListener("click", () => {
    const city = travelCityInput.value.trim();
    if (city) checkTravel(city);
  });

  travelCityInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") travelSearchBtn.click();
  });
}