/**
 * MCP Tool: Get Current Weather Information
 * Fetches and returns current weather conditions for Kathmandu Valley
 */

export const getCurrentWeather = {
  name: "get_current_weather",
  description:
    "Get current weather information including temperature, condition, humidity, precipitation, and wind speed for Kathmandu Valley",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "Specific area in Nepal (optional, defaults to Kathmandu)",
      },
    },
  },
  handler: async ({ location = "Kathmandu" }) => {
    try {
      // Default Kathmandu coordinates (city center)
      let lat = 27.7172;
      let lng = 85.324;
      let locationName = "Kathmandu Valley";
      
      // Parse location if it's in format "lat,lng" (coordinates)
      if (location.includes(",") && !isNaN(parseFloat(location.split(",")[0]))) {
        const parts = location.split(",");
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
        
        // Try to reverse geocode to get location name
        try {
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1&accept-language=en`
          );
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            // Extract meaningful location name
            const address = geoData.address;
            if (address) {
              locationName = address.neighbourhood || address.suburb || address.city || address.village || 
                           address.town || address.county || "Kathmandu Valley";
            }
          }
        } catch (geoError) {
          console.log("Reverse geocoding failed, using default name");
        }
      } else {
        locationName = location;
      }

      // Fetch weather from Open-Meteo (free, no API key required)
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weathercode,windspeed_10m&timezone=Asia/Kathmandu`
      );

      if (!weatherResponse.ok) {
        throw new Error("Weather API unavailable");
      }

      const weatherData = await weatherResponse.json();
      const current = weatherData.current;

      // Weather code interpretation (WMO Weather codes)
      const weatherConditions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
      };

      const weatherCode = current.weathercode;
      const condition = weatherConditions[weatherCode] || "Unknown conditions";
      const temperature = current.temperature_2m;
      const humidity = current.relative_humidity_2m;
      const precipitation = current.precipitation || 0;
      const isRaining = current.rain > 0 || precipitation > 0;
      const windSpeed = current.windspeed_10m || 0;

      // Weather icon/emoji
      const weatherEmoji =
        weatherCode === 0 || weatherCode === 1
          ? "☀️"
          : weatherCode === 2 || weatherCode === 3
          ? "⛅"
          : weatherCode >= 51 && weatherCode <= 65
          ? "🌧️"
          : weatherCode === 71 || weatherCode === 73 || weatherCode === 75
          ? "❄️"
          : weatherCode === 95 || weatherCode === 96
          ? "⛈️"
          : weatherCode === 45 || weatherCode === 48
          ? "🌫️"
          : "🌤️";

      // Comfort level description
      let comfortLevel = "pleasant";
      let comfortMessage = "Perfect weather for outdoor activities!";
      
      if (temperature > 30) {
        comfortLevel = "hot";
        comfortMessage = "It's quite hot outside. Stay hydrated and prefer lighter meals.";
      } else if (temperature < 10) {
        comfortLevel = "cold";
        comfortMessage = "It's quite cold. Perfect weather for hot meals and drinks!";
      } else if (temperature >= 10 && temperature <= 20) {
        comfortLevel = "cool";
        comfortMessage = "Cool and comfortable weather. Great for any meal preference.";
      } else if (temperature > 20 && temperature <= 30) {
        comfortLevel = "warm";
        comfortMessage = "Warm and pleasant weather.";
      }

      // Add weather-specific comfort adjustments
      if (isRaining) {
        comfortLevel += "_rainy";
        comfortMessage = "Rainy weather - perfect for indoor dining and hot comfort foods!";
      }
      if (windSpeed > 25) {
        comfortLevel += "_windy";
        if (!comfortMessage.includes("windy")) {
          comfortMessage = "Windy conditions - good for staying indoors with warm meals.";
        }
      }

      return {
        success: true,
        data: {
          location: locationName,
          timestamp: current.time,
          currentTime: new Date().toLocaleString("en-US", {
            timeZone: "Asia/Kathmandu",
          }),
          weather: {
            emoji: weatherEmoji,
            condition: condition,
            temperature: `${temperature}°C`,
            feelsLike: temperature > 30 
              ? `${Math.round(temperature + 2)}°C` 
              : temperature < 10 
              ? `${Math.round(temperature - 2)}°C` 
              : `${temperature}°C`,
            humidity: `${humidity}%`,
            precipitation: `${precipitation}mm`,
            isRaining: isRaining,
            windSpeed: `${windSpeed} km/h`,
            weatherCode: weatherCode,
          },
          comfort: {
            level: comfortLevel,
            description: comfortMessage,
          },
          summary: `Current weather in ${locationName}: ${weatherEmoji} ${condition}, ${temperature}°C with ${humidity}% humidity. ${precipitation > 0 ? `${precipitation}mm of precipitation. ` : ""}Wind: ${windSpeed} km/h.`,
        },
      };
    } catch (error) {
      console.error("❌ Weather fetch failed:", error.message);
      return {
        success: false,
        error: error.message,
        data: {
          weather: null,
          message: "Unable to fetch current weather data.",
        },
      };
    }
  },
};

