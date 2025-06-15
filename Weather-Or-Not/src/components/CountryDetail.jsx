import { useEffect, useState } from "react";
import { getWeatherData } from "../services/weather_api";
import { toast } from "sonner";
import tzLookup from "tz-lookup";

const CountryDetail = ({ country }) => {
  const [weather, setWeather] = useState({
    sunrise: "",
    sunset: "",
    temperature: "",
    weatherIcon: "",
    humidity: "",
    maxTemp: "",
    minTemp: "",
    wind: "",
  });

  useEffect(() => {
    const fetchWeather = async (country) => {
      if (!country) return;
      try {
        const weatherData = await getWeatherData(country);
        const [lat, lon] = country.latlng;
        /** Note: Get timezone from coordinates */
        const timeZone = tzLookup(lat, lon);

        const formatTime = (unixTime) =>
          new Date(unixTime * 1000).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone,
          });

        setWeather({
          sunrise: formatTime(weatherData.sys.sunrise),
          sunset: formatTime(weatherData.sys.sunset),
          temperature: weatherData.main.temp,
          weatherIcon: weatherData.weather[0].icon,
          humidity: weatherData.main.humidity,
          maxTemp: weatherData.main.temp_max,
          minTemp: weatherData.main.temp_min,
          wind: weatherData.wind.speed,
        });
      } catch (error) {
        toast.error(`Error fetching weather data: ${error.message}`);
      }
    };
    fetchWeather(country);
  }, []);

  if (!country || !weather) {
    return null;
  }

  const flagUrl = country.flags?.png || country.flags?.svg;
  const countryName = country.name?.common || "Unknown Country";
  const capital = country.capital?.[0] || "Unknown Capital";

  return (
    <div>
      <h2>Country Details</h2>
      <div>
        {flagUrl && (
          <img
            src={flagUrl}
            alt={`Flag of ${countryName}`}
            style={{
              width: "60px",
              height: "40px",
              objectFit: "cover",
              border: "1px solid #ddd",
            }}
          />
        )}
        <div>
          <p>
            <strong>Country:</strong> {countryName}
          </p>
          <p>
            <strong>Capital:</strong> {capital}
          </p>
          <h3>weather in {country.capital[0]}</h3>
          <p>temperature {weather.temperature + " °Celcius"}</p>
          <p>Sunrise {weather.sunrise}</p>
          <p>Sunset {weather.sunset}</p>
          {weather.weatherIcon === "" ? null : (
            <img
              style={{ height: "200px", width: "200px" }}
              alt="wetherIcon"
              src={` https://openweathermap.org/img/wn/${weather.weatherIcon}@2x.png`}
            />
          )}
          <p>humidity {weather.humidity + " %"}</p>
          <p>max temperature {weather.maxTemp + " °Celcius"}</p>
          <p>min temperature {weather.minTemp + " °Celcius"}</p>
          <p>wind {weather.wind + " m/s"}</p>
        </div>
      </div>
    </div>
  );
};

export default CountryDetail;
