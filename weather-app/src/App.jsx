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
import fetchGeminiNews from "./api/fetchGeminiNews"; 
import GeminiNews from "./components/GeminiNews.jsx";

function App() {
  const [backgroundLoading, setBackgroundLoading] = useState(false);
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
  const [cityInfoLoading, setCityInfoLoading] = useState(false);  
  const [cityInfoError, setCityInfoError] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(null);
  const [geminiNewsData, setGeminiNewsData] = useState(null);
  const [geminiNewsLoading, setGeminiNewsLoading] = useState(false);
  const [geminiNewsError, setGeminiNewsError] = useState(null);
  const [newsSource, setNewsSource] = useState("gemini"); // "newsapi" or "gemini"

  // Refs to track dropdown and toggle button elements
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
    fetchGeminiNewsData("Kathmandu");
  }, []);

  // Fetch AQI data when weather data is available
  useEffect(() => {
    if (weatherData?.coord?.lat && weatherData?.coord?.lon) {
      getAqiData(weatherData.coord.lat, weatherData.coord.lon);
    }
  }, [weatherData]);

  const getBackgroundData = async (city) => {
    try {
      setBackgroundLoading(true);
      const data = await fetchBackground(city);
      setBackgroundData(data);
    } catch (error) {
      console.log("Error Fetching Background", error);
    } finally {
      setBackgroundLoading(false);
    }
  };

  // Fetch AQI data based on latitude and longitude from weather data
  // This function is called after weather data is fetched
  const getAqiData = async (lat, lon) => {
    const data = await fetchAqi(lat, lon);
    console.log("Aqi Data in App.jsx", data);
    setAqiData(data);
  };

  // Fetch city information using Gemini AI
  const getCityInfoData = async (city) => {
    try {
      setCityInfoLoading(true);
      setCityInfoError(null);
      // Fetch city information using the fetchCityInfo API
      const result = await fetchCityInfo(city);
      
      if (result.success) {
        // If the fetch is successful, update the city info data state
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

  // Fetch and manages news data for the selected city
  const getNewsData = async (city) => {
    try {
      setNewsLoading(true);
      setNewsError(null);
      fetchGeminiNewsData(city)
       const newsResult = await fetchNews(city);
      if (newsResult.success) {
        setNewsData(newsResult.data);
      } else {
        setNewsError(newsResult.error);
        setTimeout(() => {
          setNewsError(null);
        }, 5000);
        setNewsSource("gemini");
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
  
  // Fetch news data using Gemini AI
  const fetchGeminiNewsData = async (city) => {
  setGeminiNewsLoading(true);
  setGeminiNewsError(null);
  setGeminiNewsData(null);
  try {
    const result = await fetchGeminiNews(city);
    if (result.success) {
      setGeminiNewsData(result.data);
      console.log("Gemini News Data:", result.data);
    } else {
      setGeminiNewsError(result.error);
    }
  } catch (error) {
    setGeminiNewsError(error.message);
  } finally {
    setGeminiNewsLoading(false);
  }
};

  // Handle click outside to close recent searches
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showRecentSearches &&   // Check if recent searches panel is open
        recentSearchesRef.current && // Panel element exists
        toggleButtonRef.current && // Toggle button element exists
        !recentSearchesRef.current.contains(event.target) &&  // Click not in dropdown
        !toggleButtonRef.current.contains(event.target) // Click not on toggle button
      ) {
        setShowRecentSearches(false); //close the dropdown
      }
    };

    //Only Add event listener when panel is open
    if (showRecentSearches) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup event listener
    return () => document.removeEventListener("mousedown", handleClickOutside);
  
  }, [showRecentSearches]);

  // Fetch weather data for the given city
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

  // const localTime = weatherData ? getCityLocalTime(weatherData?.timezone) : "";

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

  // Handle search input and fetch all data related to the city
  const handleSearch = async (city) => {
    // Save to recent searches only if the search is successful
    const trimmedCity = city.trim();
    if (trimmedCity) {
      try {
        const weatherResult = await getWeatherData(trimmedCity);
        if (weatherResult.cod === 200) {
          // Add to recent searches after successful search
          addRecentSearch(trimmedCity);
          // Fetch background, city info, and news data concurrently
          await Promise.all([
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

  // Handle selection from recent searches
  const handleRecentSearchSelect = async (city) => {
    try {
      setLoading(true);
      const weatherResult = await getWeatherData(city);
      if (weatherResult.cod === 200) {          
          await Promise.all([
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

  // Toggle recent searches panel visibility
  // This function is called when the toggle button is clicked
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
  // Close the chart modal and reset forecast data
  const handleCloseChart = () => {
    setShowChart(false);
    setForecastData(null);
  };
  // Handle active menu selection
  const handleActiveMenu = (menu) => {
    setActiveMenu(menu);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <WeatherCard>
        <div className="relative h-[450px]">
          <BackgroundImage
            loading={backgroundLoading}
            backgroundData={backgroundData}
          />
          <WeatherHeader
            weatherData={weatherData}
            getCityLocalTime={getCityLocalTime}
            country={country}
            onShowChart={handleShowChart}
          />

          {/* Search Bar */}
          <div className="flex flex-col items-center justify-center h-[300px]">
            <SearchBar
              handleSearch={handleSearch}
              error={error}
              onClearError={clearError}
            />
          </div>

          {/* Toggle Button for Recent Searches */}
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
          

          {/* Navigation Menu Component */}
          {/* Renders tabs for Weather, Air Quality, City Info, and News sections */}
          <WeatherNavigationMenu
            activeMenu={activeMenu}
            handleActiveMenu={handleActiveMenu}
          />
        </div>        
        
        {/* Bottom Section */}
        <div className="bg-white/80 px-4 py-4 h-[110px]">
          <div className="h-full w-full flex items-start justify-center overflow-y-auto">
            <div className="w-full max-w-4xl">
              {/* Conditional Rendering of Content Based on Active Menu */}
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
                <>

                  {/* Show NewsContent or GeminiNews based on source */}
                  {newsSource === "newsapi" && (
                    <NewsContent
                      newsData={newsData}
                      loading={newsLoading}
                      error={newsError}
                    />
                  )}
                 
                  {newsSource === "gemini" && (
                    <GeminiNews
                      newsData={geminiNewsData}
                      loading={geminiNewsLoading}
                      error={geminiNewsError}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </WeatherCard>
       {/* Always show toggle for news sources */}
        {activeMenu === "NEWS"&& (    
          <div className="absolute bottom-8 flex gap-2 mb-2">
          <button
            className={`px-3 py-1 rounded ${newsSource === "newsapi" ? "bg-blue-500 text-white" : "bg-gray-200 text-blue-500"}`}
            onClick={() => setNewsSource("newsapi")}
            disabled={!newsData}
            title={newsData ? "Show Standard News" : "Standard News not available yet"}
          >
            Standard News
          </button>
          <button
            className={`px-3 py-1 rounded ${newsSource === "gemini" ? "bg-blue-500 text-white" : "bg-gray-200 text-blue-500"}`}
            onClick={() => setNewsSource("gemini")}
            disabled={!geminiNewsData}
            title={geminiNewsData ? "Show Gemini AI News" : "Gemini AI News not available yet"}
          >
            Gemini AI News
          </button>
        </div>)}
        
            
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
      
    </div>
  );
}

export default App;
