const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const { city } = event.queryStringParameters;

  if (!city) {
    return { statusCode: 400, body: JSON.stringify({ error: "City is required" }) };
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=${apiKey}`
    );

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: "Failed to fetch geocode" }) };
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
