const axios = require('axios');

exports.handler = async (event) => {
  try {
    const { city, lat, lon } = event.queryStringParameters;
    if (!city && !(lat && lon)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'City or coordinates required' }) };
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    let apiUrl;
    if (city) {
      apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    } else {
      apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    }

    const response = await axios.get(apiUrl);
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};