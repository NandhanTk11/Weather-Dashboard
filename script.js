const apiKey = "2ebf9ba85d8c3ff276a05856cb3bdae7"; // Replace with your OpenWeatherMap API key

// Correct element references
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
//for travel.html
const travelSearchBtn = document.getElementById("travelSearchBtn");
const travelCityInput = document.getElementById("travelCityInput");
const travelMessageElem = document.getElementById("travelMessage");

let forecastData = null;
let currentDayIndex = 0;

// Helper function to group forecast by day
function groupByDay(list) {
  const daily = {};
  list.forEach((entry) => {
    const date = entry.dt_txt.split(" ")[0];
    if (!daily[date]) daily[date] = [];
    daily[date].push(entry);
  });
  return daily;
}

// Display weather information
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

  // Take midday forecast if available
  const weatherData = todayData[Math.floor(todayData.length / 2)] || todayData[0];
  const { main, weather, dt } = weatherData;
  const condition = weather[0].main;
  const icon = weather[0].icon;

  // Determine day/night from icon code
  const isDay = icon.includes("d");

  // Update UI
  weatherIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  locationElem.textContent = forecastData.city.name;
  temperatureElem.textContent = `${Math.round(main.temp)}°C`;
  conditionElem.textContent = condition;

  // Set custom weather message
  let message = "";
  switch (condition) {
    case "Clear":
      message = isDay
        ? "☀ It’s sunny, wear sunglasses!"
        : "🌙 Clear night sky, enjoy the stars!";
      break;
    case "Clouds":
      message = isDay
        ? "☁ Partly cloudy, still bright outside."
        : "☁🌙 Cloudy night, moon might be hidden.";
      break;
    case "Rain":
      message = isDay
        ? "🌧 It’s raining, don’t forget your umbrella!"
        : "🌧🌙 Rainy night, drive safe!";
      break;
    case "Drizzle":
      message = isDay
        ? "🌦 Light drizzle, maybe carry an umbrella."
        : "🌦🌙 Drizzly night, roads may be slippery.";
      break;
    case "Thunderstorm":
      message = "⛈ Stormy weather, better stay inside.";
      break;
    case "Snow":
      message = isDay
        ? "❄ Snowfall, dress warmly!"
        : "❄🌙 Snowy night, roads may freeze.";
      break;
    case "Mist":
    case "Fog":
    case "Haze":
    case "Smoke":
    case "Dust":
      message = isDay
        ? "🌫 Low visibility, be careful when traveling."
        : "🌫🌙 Foggy night, drive carefully.";
      break;
    default:
      message = "ℹ Weather updates available, stay prepared.";
  }

  messageElem.textContent = message;

  // Optional: Update travel suggestion dynamically
  if (travelMessageElem) {
    if (condition === "Rain") travelMessageElem.textContent = "☔ Consider indoor activities!";
    else if (condition === "Snow") travelMessageElem.textContent = "❄ Perfect for snow sports!";
    else travelMessageElem.textContent = "🌞 Great weather for travel!";
  }
}

// Fetch weather for a specific city
async function fetchWeather(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      alert("City not found!");
      return;
    }

    forecastData = await response.json();
    currentDayIndex = 0;
    displayWeather();
  } catch (error) {
    alert("Error fetching weather data!");
    console.error(error);
  }
}

if (searchBtn && searchInput && prevDayBtn && nextDayBtn) {
  // Search button click
  searchBtn.addEventListener("click", () => {
    const city = searchInput.value.trim();
    if (city) fetchWeather(city);
  });

  // Search on Enter key
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") searchBtn.click();
  });

  // Previous day button
  prevDayBtn.addEventListener("click", () => {
    if (!forecastData) return;
    const dailyData = groupByDay(forecastData.list);
    if (currentDayIndex > 0) {
      currentDayIndex--;
      displayWeather();
    }
  });

  // Next day button
  nextDayBtn.addEventListener("click", () => {
    if (!forecastData) return;
    const dailyData = groupByDay(forecastData.list);
    const days = Object.keys(dailyData);
    if (currentDayIndex < days.length - 1) {
      currentDayIndex++;
      displayWeather();
    }
  });
}

// Auto-load for current location
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
      } catch (error) {
        fetchWeather("Mumbai");
      }
    },
    () => {
      fetchWeather("Mumbai"); // fallback city
    }
  );
});


// Function to check travel suggestion
// --- TRAVEL PAGE ONLY ---
// --- TRAVEL PAGE ONLY ---
if (travelSearchBtn && travelCityInput && travelMessageElem) {
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

      // Travel suggestion message
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

      // Build HTML output
      travelMessageElem.innerHTML = `
        <div style="text-align:center;">
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${condition}">
          <p><strong>${city}</strong></p>
          <p>🌡 ${temp}°C | ${condition}</p>
          <p>${suggestion}</p>
        </div>
      `;
     } catch (error) {
      travelMessageElem.textContent = "⚠ Error fetching weather data";
      console.error(error);
     }
  }

  // Travel button click
  travelSearchBtn.addEventListener("click", () => {
    const city = travelCityInput.value.trim();
    if (city) checkTravel(city);
  });

  // Enter key support
  travelCityInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") travelSearchBtn.click();
  });
}