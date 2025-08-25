import config from "../config/config";

// Fetch forecast data from the API
const fetchForecast = async (city) => {
  const { baseApiUrl, API_KEY } = config;
  try {
    // fetch the forecast data from the OpenWeatherMap API
    const response = await fetch(
      `${baseApiUrl}/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();

    // Check if the response is successful
    if (data.cod === "200") {
      // Process the forecast data to get daily temperatures
      const dailyData = processForecastData(data.list);

      // Return the processed data along with city information
      return {
        success: true,
        data: dailyData,
        city: data.city,
      };
    } else {
      return {
        success: false,
        error: data.message,
      };
    }
  } catch (error) {
    console.log("error in fetchForecast", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Process forecast data to get daily min/max temperatures
const processForecastData = (forecastList) => {
  const dailyData = {};
  // Group forecast data by day
  // Each item in forecastList is an object with a dt (timestamp) and main (temperature) properties
  forecastList.forEach((item) => {
    // Convert Unix timestamp to Date object for date formatting
    const date = new Date(item.dt * 1000);
    // Format the date to show "Day, Month Date" (e.g., "Mon, Jan 15")
    const day = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    // Initialize the data structure for each new day
    if (!dailyData[day]) {
      dailyData[day] = {
        date: day,
        temps: [], // Array to hold temperatures for the day
        weather: item.weather[0].main, // Main weather condition (e.g., Clear, Rain)
        icon: item.weather[0].icon, // Weather icon code
      };
    }
    // Store each temperature reading for the day
    dailyData[day].temps.push(item.main.temp);
  });

  // Transform daily data into final format and calculate temperature statistics
  // Calculate min/max for each day
  return Object.values(dailyData)
    .map((day) => ({
      date: day.date,
      minTemp: Math.round(Math.min(...day.temps)), // Round min temperature
      maxTemp: Math.round(Math.max(...day.temps)), // Round max temperature
      avgTemp: Math.round(
        day.temps.reduce((a, b) => a + b, 0) / day.temps.length
      ), // Round average temperature
      weather: day.weather,
      icon: day.icon,
    }))
    .slice(0, 5); // Limit to 5-day forecast
};

export default fetchForecast;
