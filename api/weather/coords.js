import fetch from "node-fetch";

export default async function handler(req, res) {
  const { lat, lon } = req.query;
  const API_KEY = process.env.WEATHER_API_KEY;

  if (!lat || !lon) return res.status(400).json({ error: "lat/lon required" });

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
}
