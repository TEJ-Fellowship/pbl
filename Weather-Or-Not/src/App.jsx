import { useEffect, useState, useRef } from "react";
import { getAllCountries } from "./services/countries_api";
import { getWeatherData } from "./services/weather_api";
import { toast } from "sonner";

function App() {
  const [countryData, setCountryData] = useState([]);
  const [weather, setWeather] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const fetchCountries = async () => {
      toast.info("Fetching countries...");
      try {
        const countriesData = await getAllCountries();
        setCountryData(countriesData);
        toast.success("Countries fetched successfully");
      } catch (error) {
        toast.error(`Error in fetching countries data: ${error.message}`);
      }
    };
    const fetchWeaher = async (country) => {
      try {
        const weatherData = await getWeatherData(country);
        setWeather(weatherData);
      } catch (error) {
        throw error;
      }
    };
    fetchCountries();
    fetchWeaher(countryData[0]);
  }, []);

  return (
    <>
      <h1>Weather or Not</h1>
      <p>Your comprehensive weather and air quality companion</p>
      <h2>Weather</h2>
      {weather && (
        <div>
          <h2>Weather in {weather.location.name}</h2>
          <p>Temperature: {weather.current.temp_c}°C</p>
          <p>Condition: {weather.current.condition.text}</p>
          <p>Humidity: {weather.current.humidity}%</p>
          <p>Wind Speed: {weather.current.wind_kph} km/h</p>
          <p>Pressure: {weather.current.pressure_mb} mb</p>
          <p>Visibility: {weather.current.vis_km} km</p>
        </div>
      )}
      <h2>Countries List</h2>
      <ul>
        {countryData.map((country) => (
          <li key={country.cca2 || country.cca3}>{country.name.common}</li>
        ))}
      </ul>
      {}
    </>
  );
}

export default App;
