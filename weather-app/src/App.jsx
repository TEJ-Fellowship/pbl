import { useState, useEffect } from "react";
import "./styles/App.css";
import SearchBar from "./components/SearchBar";
import WeatherNavigationMenu from "./components/WeatherNavigation";
import WeatherHeader from "./components/WeatherHeader";
import WeatherCard from "./components/WeatherCard";
import BackgroundImage from "./components/BackgroundImage";
import WeatherContent from "./components/WeatherContent";
import fetchWeather from "./api/fetchWeather";
import fetchAqi from "./api/fetchAqi";
import AqiContent from "./components/AqiContent";
import fetchBackground from "./api/fetchBackground";

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [activeMenu, setActiveMenu] = useState("WEATHER");
  const [aqiData, setAqiData] = useState(null);
  const [backgroundData, setBackgroundData] = useState(null);

  useEffect(() => {
    getWeatherData("Kathmandu");
    getBackgroundData("Kathmandu");
  }, []);

  useEffect(() => {
    if (weatherData?.coord?.lat && weatherData?.coord?.lon) {
      getAqiData(weatherData.coord.lat, weatherData.coord.lon);
    }
  }, [weatherData]);

  const getBackgroundData = async (city) => {
    const data = await fetchBackground(city);
    setBackgroundData(data);
  };

  const getAqiData = async (lat, lon) => {
    const data = await fetchAqi(lat, lon);
    console.log("Aqi Data in App.jsx", data);
    setAqiData(data);
  };

  const getWeatherData = async (city) => {
    try {
      setLoading(true);
      const data = await fetchWeather(city);
      // If city is found, set weather data
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
    } finally {
      setLoading(false);
    }
  };

  const getCityLocalTime = (timezoneOffsetInSeconds) => {
    const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
    const cityTime = new Date(utc + 1000 * timezoneOffsetInSeconds);
    return cityTime.toLocaleString(); // or toLocaleTimeString() or toLocaleDateString()
  };

  const localTime = weatherData ? getCityLocalTime(weatherData?.timezone) : "";

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
    getBackgroundData(city);
  };

  const handleActiveMenu = (menu) => {
    setActiveMenu(menu);
  };

  return (
    <>
      <WeatherCard>
        <div className="relative h-[450px]">
          <BackgroundImage backgroundData={backgroundData} />
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
          <WeatherNavigationMenu
            activeMenu={activeMenu}
            handleActiveMenu={handleActiveMenu}
          />
        </div>
        {/* Bottom Section */}
        <div className="bg-white/80 px-8 py-6 flex flex-col md:flex-row items-center gap-8">
          {activeMenu === "WEATHER" && (
            <WeatherContent weatherData={weatherData} />
          )}
          {activeMenu === "AIR QUALITY" && <AqiContent aqiData={aqiData} />}
        </div>
      </WeatherCard>
    </>
  );
}

export default App;
