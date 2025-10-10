// server.js
// Simple Express proxy for OpenWeather API
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());            // allow CORS (you can restrict origin in production)
app.use(express.static("."));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.WEATHER_API_KEY;

if (!API_KEY) {
  console.error("Missing WEATHER_API_KEY in environment. Create .env with WEATHER_API_KEY=...");
  process.exit(1);
}

async function fetchJson(url) {
  // Uses global fetch (Node 18+). If fetch is not present, you can install node-fetch.
  if (typeof fetch === "function") {
    const res = await fetch(url);
    const data = await res.json();
    return { status: res.status, data };
  } else {
    // fallback to node-fetch if older Node
    const fetch = require("node-fetch");
    const res = await fetch(url);
    const data = await res.json();
    return { status: res.status, data };
  }
}

// GET /weather?city=CityName
app.get("/weather", async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: "city query param required" });

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric`;

  try {
    const { status, data } = await fetchJson(url);
    return res.status(status).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal server error" });
  }
});

// GET /weather/coords?lat=...&lon=...
app.get("/weather/coords", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  try {
    const { status, data } = await fetchJson(url);
    return res.status(status).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal server error" });
  }
});

app.listen(PORT, () => console.log(`Weather proxy running on port ${PORT}`));
