import { useState, useEffect, useRef } from "react";
import "./styles/App.css";
import SearchBar from "./components/SearchBar";
import WeatherNavigationMenu from "./components/WeatherNavigation";
import WeatherHeader from "./components/WeatherHeader";
import WeatherCard from "./components/WeatherCard";
import BackgroundImage from "./components/BackgroundImage";
import WeatherDisplay from "./components/WeatherDisplay";
import RecentSearches from "./components/RecentSearches";
import fetchWeather from "./api/fetchWeather";
import { useRecentSearches } from "./hooks/useRecentSearches";

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  
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
    hasSearches
  } = useRecentSearches();

  useEffect(() => {
    getWeatherData("Kathmandu");
  }, []);

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
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRecentSearches]);
  // Handle click outside to close recent searches

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
    // Save to recent searches only if the search is successful
    const trimmedCity = city.trim();
    if (trimmedCity) {
      await getWeatherData(trimmedCity);
      // Add to recent searches after successful search
      addRecentSearch(trimmedCity);
    }
  };

  const handleRecentSearchSelect = (city) => {
    handleSearch(city);
    setShowRecentSearches(false); // Hide recent searches after selection
  };

  const toggleRecentSearches = () => {
    setShowRecentSearches(!showRecentSearches);
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
          <button 
            ref={toggleButtonRef}
            onClick={toggleRecentSearches}
            className={`absolute bottom-16 right-8 px-4 py-2 rounded-full shadow transition-colors ${
              showRecentSearches 
                ? 'bg-green-500 text-white' 
                : 'bg-green-400 text-white hover:bg-green-500'
            } ${!hasSearches ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!hasSearches}
            title={hasSearches ? 'Toggle recent searches' : 'No recent searches available'}
          >
            LATEST LOCATIONS
          </button>
          
          {/* Recent Searches Panel */}
          {showRecentSearches && (
            <div ref={recentSearchesRef} className="absolute bottom-28 right-8 w-72 z-10">
              <RecentSearches
                recentSearches={recentSearches}
                onSearchSelect={handleRecentSearchSelect}
                onRemoveSearch={removeSearch}
                onClearAll={clearAllSearches}
                isLoading={isLoadingSearches}
              />
            </div>
          )}
          
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
