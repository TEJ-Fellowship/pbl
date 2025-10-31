/**
 * MCP Tool: Check Weather Impact on Delivery
 * Checks Kathmandu weather conditions and estimates delivery delay
 */

export const checkWeatherDelay = {
  name: "check_weather_delay",
  description:
    "Check current weather conditions in Kathmandu Valley and estimate potential delivery delays due to weather",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "Specific area in Kathmandu Valley (optional)",
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
      const isRaining = current.rain > 0 || current.precipitation > 0;
      const isBadWeather =
        weatherCode >= 61 || weatherCode === 45 || weatherCode === 48;
      const windSpeed = current.windspeed_10m || 0;

      // Calculate delay factor
      let delayMinutes = 0;
      let delayReason = [];

      if (isRaining) {
        if (weatherCode >= 63 && weatherCode <= 65) {
          // Heavy rain
          delayMinutes += 20;
          delayReason.push("heavy rain");
        } else {
          // Light/moderate rain
          delayMinutes += 10;
          delayReason.push("rain");
        }
      }

      if (weatherCode === 95 || weatherCode === 96) {
        // Thunderstorm
        delayMinutes += 30;
        delayReason.push("thunderstorm");
      }

      if (weatherCode === 45 || weatherCode === 48) {
        // Fog
        delayMinutes += 15;
        delayReason.push("fog");
      }

      if (windSpeed > 30) {
        // Strong wind
        delayMinutes += 10;
        delayReason.push("strong winds");
      }

      // Impact assessment
      let impact = "minimal";
      let message = "Weather conditions are good for delivery.";

      if (delayMinutes >= 20) {
        impact = "significant";
        message = `Weather is causing delivery delays. Current conditions: ${condition}. Expected additional delay: ${delayMinutes} minutes.`;
      } else if (delayMinutes >= 10) {
        impact = "moderate";
        message = `Weather may be affecting delivery times. Current conditions: ${condition}. Expected additional delay: ${delayMinutes} minutes.`;
      } else if (isBadWeather) {
        impact = "minor";
        message = `Weather conditions are less than ideal (${condition}) but delivery should proceed normally.`;
      }

      return {
        success: true,
        data: {
          location: locationName,
          timestamp: current.time,
          weather: {
            condition: condition,
            temperature: `${current.temperature_2m}°C`,
            humidity: `${current.relative_humidity_2m}%`,
            precipitation: `${current.precipitation}mm`,
            rain: isRaining,
            windSpeed: `${windSpeed} km/h`,
            weatherCode: weatherCode,
          },
          deliveryImpact: {
            impact: impact, // minimal, minor, moderate, significant
            estimatedDelay: delayMinutes,
            reason: delayReason.join(", ") || "none",
            message: message,
          },
          recommendation:
            delayMinutes > 0
              ? "Deliveries may be delayed due to weather conditions. Please be patient, and ensure your delivery location is easily accessible."
              : "Weather conditions are favorable for on-time delivery.",
        },
      };
    } catch (error) {
      console.error("❌ Weather check failed:", error.message);
      return {
        success: false,
        error: error.message,
        data: {
          deliveryImpact: {
            impact: "unknown",
            estimatedDelay: 0,
            message:
              "Unable to fetch weather data. Deliveries should proceed normally unless local conditions suggest otherwise.",
          },
        },
      };
    }
  },
};
