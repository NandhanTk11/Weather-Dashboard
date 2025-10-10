import fetch from "node-fetch";

export default async function handler(req, res) {
  const { city } = req.query;
  const API_KEY = process.env.WEATHER_API_KEY;

  if (!city) return res.status(400).json({ error: "city required" });

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
}
