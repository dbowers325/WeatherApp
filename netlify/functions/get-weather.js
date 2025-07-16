const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const { lat, lon, city, units } = event.queryStringParameters;

  if ((!lat || !lon) && !city) {
    return { statusCode: 400, body: JSON.stringify({ error: "Latitude/Longitude or city is required" }) };
  }

  let url = "https://api.openweathermap.org/data/2.5/weather?";
  if (lat && lon) {
    url += `lat=${lat}&lon=${lon}`;
  } else if (city) {
    url += `q=${encodeURIComponent(city)}`;
  }
  url += `&appid=${apiKey}&units=${units || "imperial"}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: "Failed to fetch weather" }) };
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
