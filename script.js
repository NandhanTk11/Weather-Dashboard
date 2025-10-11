
const apiKey = "Your_api_here"; // Replace with your OpenWeatherMap API key
// ======== Helper Functions ====

// Show/hide loading state
let oldCaption = "";

function showLoading(show) {
  const icon = document.getElementById("weather-icon");
  const temp = document.getElementById("temperature");
  const condition = document.getElementById("condition");
  const caption = document.getElementById("caption");
[icon, temp, condition].forEach(el => {
    if (el) el.style.opacity = show ? "0.5" : "1";
  });

  if (caption) {
    if (show) {
      oldCaption = caption.textContent;
      caption.textContent = "Loading...";
    } else {
      caption.textContent = oldCaption || "";
    }
  }
}

// Group forecast entries by day
function groupByDay(list) {
  const daily = {};
  list.forEach((entry) => {
    const date = entry.dt_txt.split(" ")[0];
    if (!daily[date]) daily[date] = [];
    daily[date].push(entry);
  });
  return daily;
}

// Find forecast closest to current time
function getClosestForecast(forecasts) {
  const now = Date.now() / 1000; // current UTC time in seconds
  const closest = forecasts.reduce((prev, curr) =>
    Math.abs(curr.dt - now) < Math.abs(prev.dt - now) ? curr : prev
  );

  // Debug log
  const forecastTime = new Date(closest.dt * 1000).toUTCString();
  console.log("Closest forecast selected:", {
    dt: closest.dt,
    forecastTimeUTC: forecastTime,
    temp: closest.main.temp,
    condition: closest.weather[0].main,
    icon: closest.weather[0].icon
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

  // Display weather info
  function displayWeather() {
    if (!forecastData) return;

    const dailyData = groupByDay(forecastData.list);
    const days = Object.keys(dailyData);
    const todayData = dailyData[days[currentDayIndex]];
    if (!todayData) return;

    // Update day display
    if (currentDayIndex === 0) {
      dayDisplayElem.textContent = "Today's Weather";
    } else {
      const date = new Date(days[currentDayIndex]);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      dayDisplayElem.textContent = `${dayName}'s Weather`;
    }

    // Pick forecast closest to now
    const weatherData = getClosestForecast(todayData);
    const { main, weather, dt } = weatherData;
    const condition = weather[0].main;
    const icon = weather[0].icon;

    const sunrise = forecastData.city.sunrise;
    const sunset = forecastData.city.sunset;
    const isDay = dt >= sunrise && dt < sunset;

    // Update UI
    weatherIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    locationElem.textContent = forecastData.city.name;
    temperatureElem.textContent = `${Math.round(main.temp)}°C`;
    conditionElem.textContent = condition;

    // Weather message
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
        message = "ℹ Weather updates available, stay prepared.";
    }

    messageElem.textContent = message;
  }

  // Fetch weather for a city
  async function fetchWeather(city) {
    try {
      showLoading(true);
      const encodedCity = encodeURIComponent(city);
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${apiKey}&units=metric`
      );

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

  // Button actions
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

  // Auto-load current location
  window.addEventListener("load", () => {
    if (!navigator.geolocation) {
      fetchWeather("Dubai");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
          );
          forecastData = await response.json();
          currentDayIndex = 0;
          displayWeather();
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
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );

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
