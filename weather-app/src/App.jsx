import { useState, useEffect } from "react";
import "./styles/App.css";
import SearchBar from "./components/SearchBar";
import WeatherNavigationMenu from "./components/WeatherNavigation";
import WeatherHeader from "./components/WeatherHeader";
import WeatherCard from "./components/WeatherCard";
import BackgroundImage from "./components/BackgroundImage";
import WeatherDisplay from "./components/WeatherDisplay";
import fetchWeather from "./api/fetchWeather";

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    getWeatherData("Kathmandu");
  }, []);

  const getWeatherData = async (city) => {
    try {
      setLoading(true);
      const data = await fetchWeather(city);
      console.log("App Page Data", data);
      if (data.cod === 200) {
        setWeatherData(data);
      } else {
        setError(data.message);
        // Clear error after 3 seconds
        setTimeout(() => {
          setError(null);
        }, 5000);
      }
    } catch (error) {
      console.error("App Page Error", error);
      setError(error.message);
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const getCityLocalTime = (timezoneOffsetInSeconds) => {
    const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
    const cityTime = new Date(utc + 1000 * timezoneOffsetInSeconds);
    return cityTime.toLocaleString(); // or toLocaleTimeString() or toLocaleDateString()
  };

  const localTime = getCityLocalTime(weatherData?.timezone);
  console.log("Local Time in City:", localTime);

  const getCountryName = (countryCode) => {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(countryCode); // e.g., 'Nepal'
  };

  const country = weatherData?.sys?.country
    ? getCountryName(weatherData.sys.country)
    : "";

  const clearError = () => {
    setError(null);
  };

  const handleSearch = async (city) => {
    getWeatherData(city);
  };

  return (
    <>
      <WeatherCard>
        <div className="relative h-[450px]">
          <BackgroundImage />
          <WeatherHeader
            weatherData={weatherData}
            localTime={localTime}
            country={country}
          />
          <div className="flex flex-col items-center justify-center h-[300px]">
            <SearchBar
              handleSearch={handleSearch}
              error={error}
              onClearError={clearError}
              loading={loading}
            />
          </div>
          <button className="absolute bottom-16 right-8 bg-green-400 text-white px-4 py-2 rounded-full shadow hover:bg-green-500 transition">
            LATEST LOCATIONS
          </button>
          <WeatherNavigationMenu />
        </div>
        {/* Bottom Section */}
        <div className="bg-white/80 px-8 py-6 flex flex-col md:flex-row items-center gap-8">
          <WeatherDisplay weatherData={weatherData} />
        </div>
      </WeatherCard>
    </>
  );
}

export default App;
