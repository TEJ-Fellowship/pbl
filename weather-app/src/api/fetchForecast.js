import config from "../config/config";

// Fetch forecast data from the API
const fetchForecast = async (city) => {
  const { baseApiUrl, API_KEY } = config;
  try {
    const response = await fetch(
      `${baseApiUrl}/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    console.log("Forecast data", data);

    if (data.cod === "200") {
      // Process the forecast data to get daily temperatures
      const dailyData = processForecastData(data.list);
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
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    if (!dailyData[day]) {
      dailyData[day] = {
        date: day,
        temps: [],
        weather: item.weather[0].main,
        icon: item.weather[0].icon,
      };
    }
    // Push the temperature for the day
    dailyData[day].temps.push(item.main.temp);
  });

  // Calculate min/max for each day
  return Object.values(dailyData)
    .map((day) => ({
      date: day.date,
      minTemp: Math.round(Math.min(...day.temps)),
      maxTemp: Math.round(Math.max(...day.temps)),
      avgTemp: Math.round(
        day.temps.reduce((a, b) => a + b, 0) / day.temps.length
      ),
      weather: day.weather,
      icon: day.icon,
    }))
    .slice(0, 5); // Take first 5 days
};

export default fetchForecast;
