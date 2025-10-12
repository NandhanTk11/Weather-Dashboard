const axios = require('axios');

exports.handler = async (event) => {
  try {
    const { city } = event.queryStringParameters;
    if (!city) {
      return { statusCode: 400, body: JSON.stringify({ error: 'City parameter required' }) };
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

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