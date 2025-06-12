import { useState, useEffect, useRef } from "react";
import "./styles/App.css";
import SearchBar from "./components/SearchBar";
import WeatherNavigationMenu from "./components/WeatherNavigation";
import WeatherHeader from "./components/WeatherHeader";
import WeatherCard from "./components/WeatherCard";
import BackgroundImage from "./components/BackgroundImage";
import WeatherContent from "./components/WeatherContent";
import RecentSearches from "./components/RecentSearches";
import Chart from "./components/Chart";
import ChartLoading from "./components/ChartLoading";
import fetchWeather from "./api/fetchWeather";
import fetchForecast from "./api/fetchForecast";
import { useRecentSearches } from "./hooks/useRecentSearches";
import fetchAqi from "./api/fetchAqi";
import AqiContent from "./components/AqiContent";
import fetchBackground from "./api/fetchBackground";
import fetchCityInfo from "./api/fetchCityInfo";
import CityInfo from "./components/CityInfo";
import NewsContent from "./components/NewsContent";
import fetchNews from "./api/fetchNews";

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [activeMenu, setActiveMenu] = useState("WEATHER");
  const [aqiData, setAqiData] = useState(null);
  const [backgroundData, setBackgroundData] = useState(null);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [cityInfoData, setCityInfoData] = useState(null);
  const [cityInfoLoading, setCityInfoLoading] = useState(false);  const [cityInfoError, setCityInfoError] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(null);

  // Refs for click outside detection
  const recentSearchesRef = useRef(null);
  const toggleButtonRef = useRef(null);

  // Use the custom hook for recent searches
  const {
    recentSearches,
    isLoading: isLoadingSearches,
    addRecentSearch,
    removeSearch,
    clearAllSearches,
    hasSearches,
  } = useRecentSearches();

  // Initial fetch for default city data
  // You can change "Kathmandu" to any default city you prefer
  useEffect(() => {
    getWeatherData("Kathmandu");
    getBackgroundData("Kathmandu");
    getCityInfoData("Kathmandu");
    getNewsData("Kathmandu");
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

  // Fetch AQI data based on latitude and longitude from weather data
  // This function is called after weather data is fetched
  const getAqiData = async (lat, lon) => {
    const data = await fetchAqi(lat, lon);
    console.log("Aqi Data in App.jsx", data);
    setAqiData(data);
  };

  // Fetch city information using Gemini AI
  // This function is called after weather data is fetched
  const getCityInfoData = async (city) => {
    try {
      setCityInfoLoading(true);
      setCityInfoError(null);
      const result = await fetchCityInfo(city);
      
      if (result.success) {
        setCityInfoData(result.data);
      } else {
        setCityInfoError(result.error);
        // Clear error after 5 seconds
        setTimeout(() => {
          setCityInfoError(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Error fetching city info:", error);
      setCityInfoError(error.message);
      setTimeout(() => {
        setCityInfoError(null);
      }, 5000);
    } finally {
      setCityInfoLoading(false);
    }
  };

  // Fetch news data for the selected city
  // This function is called after weather data is fetched
  const getNewsData = async (city) => {
    try {
      setNewsLoading(true);
      setNewsError(null);
      const result = await fetchNews(city);
      
      if (result.success) {
        setNewsData(result.data);
      } else {
        setNewsError(result.error);
        setTimeout(() => {
          setNewsError(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setNewsError(error.message);
      setTimeout(() => {
        setNewsError(null);
      }, 5000);
    } finally {
      setNewsLoading(false);
    }
  };

  // Handle click outside to close recent searches
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showRecentSearches &&
        recentSearchesRef.current &&
        toggleButtonRef.current &&
        !recentSearchesRef.current.contains(event.target) &&
        !toggleButtonRef.current.contains(event.target)
      ) {
        setShowRecentSearches(false);
      }
    };

    // Add event listener when panel is open
    if (showRecentSearches) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRecentSearches]);
  // Handle click outside to close recent searches
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
      return data; // Return the data so other functions can check the status
    } catch (error) {
      console.error("App Page Error", error);
      setError(error.message);
      throw error; // Rethrow so calling functions can handle it
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
    // Save to recent searches only if the search is successful
    const trimmedCity = city.trim();
    if (trimmedCity) {
      try {
        const weatherResult = await getWeatherData(trimmedCity);
        if (weatherResult.cod === 200) {
          // Add to recent searches after successful search
          addRecentSearch(trimmedCity);
          console.log("City:",trimmedCity);          await Promise.all([
            getBackgroundData(trimmedCity),
            getCityInfoData(trimmedCity),
            getNewsData(trimmedCity)
          ]);
        }
      } catch (error) {
        console.error("Error in handleSearch:", error);
        setError("Failed to fetch city data");
      }
    }
  };
  const handleRecentSearchSelect = async (city) => {
    try {
      setLoading(true);
      const weatherResult = await getWeatherData(city);
      if (weatherResult.cod === 200) {          await Promise.all([
            getBackgroundData(city),
            getCityInfoData(city),
            getNewsData(city)
          ]);
      }
    } catch (error) {
      console.error("Error in recent search select:", error);
      setError("Failed to fetch city data");
    } finally {
      setLoading(false);
      setShowRecentSearches(false); // Hide recent searches after selection
    }
  };

  const toggleRecentSearches = () => {
    setShowRecentSearches(!showRecentSearches);
  };

  //fetch forecast data for the selected city and show the chart
  const handleShowChart = async (cityName) => {
    try {
      setChartLoading(true);
      setShowChart(true);
      const forecast = await fetchForecast(cityName);

      if (forecast.success) {
        setForecastData(forecast.data);
      } else {
        console.error("Failed to fetch forecast:", forecast.error);
        setError(forecast.error);
        setShowChart(false);
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
      setError("Failed to load forecast data");
      setShowChart(false);
    } finally {
      setChartLoading(false);
    }
  };

  const handleCloseChart = () => {
    setShowChart(false);
    setForecastData(null);
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
            onShowChart={handleShowChart}
          />
          <div className="flex flex-col items-center justify-center h-[300px]">
            <SearchBar
              handleSearch={handleSearch}
              error={error}
              onClearError={clearError}
              loading={loading}
            />
          </div>
          <button
            ref={toggleButtonRef}
            onClick={toggleRecentSearches}
            className={`absolute bottom-16 right-8 px-4 py-2 rounded-full shadow transition-colors ${
              showRecentSearches
                ? "bg-green-500 text-white"
                : "bg-green-400 text-white hover:bg-green-500"
            } ${!hasSearches ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!hasSearches}
            title={
              hasSearches
                ? "Toggle recent searches"
                : "No recent searches available"
            }
          >
            LATEST LOCATIONS
          </button>

          {/* Recent Searches Panel */}
          {showRecentSearches && (
            <div
              ref={recentSearchesRef}
              className="absolute bottom-28 right-8 w-72 z-10"
            >
              <RecentSearches
                recentSearches={recentSearches}
                onSearchSelect={handleRecentSearchSelect}
                onRemoveSearch={removeSearch}
                onClearAll={clearAllSearches}
                isLoading={isLoadingSearches}
              />
            </div>
          )}

          <WeatherNavigationMenu
            activeMenu={activeMenu}
            handleActiveMenu={handleActiveMenu}
          />
        </div>        {/* Bottom Section */}
        <div className="bg-white/80 px-8 py-6 h-[120px]">
          <div className="h-full w-full flex items-start justify-center overflow-y-auto">
            <div className="w-full max-w-4xl">
              {activeMenu === "WEATHER" && (
                <WeatherContent weatherData={weatherData} />
              )}
              {activeMenu === "AIR QUALITY" && <AqiContent aqiData={aqiData} />}
              {activeMenu === "CITY INFO" && (
                <CityInfo 
                  cityInfoData={cityInfoData}
                  loading={cityInfoLoading}
                  error={cityInfoError}
                />
              )}
              {activeMenu === "NEWS" && (
                <NewsContent 
                  newsData={newsData}
                  loading={newsLoading}
                  error={newsError}
                />
              )}
            </div>
          </div>
        </div>
      </WeatherCard>

      {/* Temperature Chart Loading */}
      {chartLoading && <ChartLoading onClose={handleCloseChart} />}

      {/* Temperature Chart Modal */}
      {showChart && !chartLoading && (
        <Chart
          forecastData={forecastData}
          onClose={handleCloseChart}
          cityName={weatherData?.name}
        />
      )}
    </>
  );
}

export default App;
