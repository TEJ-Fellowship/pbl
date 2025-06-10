import { useState, useEffect } from "react";
import "./styles/App.css";

function App() {
  const [searchCity, setSearchCity] = useState("");
  const [currentWeather, setCurrentWeather] = useState({
    city: "Bucharest",
    country: "RO",
    temperature: 82,
    condition: "Rain",
    windSpeed: 4,
    highTemp: 67,
    lowTemp: 45,
    day: "Monday",
    date: "27th"
  });

  const [weeklyForecast, setWeeklyForecast] = useState([
    { day: "TUE", icon: "☁️", temp: "60°" },
    { day: "WED", icon: "☀️", temp: "72°" },
    { day: "THU", icon: "☁️", temp: "63°" },
    { day: "FRI", icon: "🌧️", temp: "65°" },
    { day: "SAT", icon: "❄️", temp: "18°" },
    { day: "SUN", icon: "☁️", temp: "69°" }
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCity.trim()) {
      // Here you would typically call a weather API
      console.log("Searching for:", searchCity);
      // For now, just update the city name
      setCurrentWeather(prev => ({
        ...prev,
        city: searchCity,
        country: "Unknown"
      }));
    }
  };

  const WeatherIcon = ({ condition }) => {
    const icons = {
      rain: "🌧️",
      sunny: "☀️",
      cloudy: "☁️",
      snow: "❄️",
      default: "🌧️"
    };
    return <span className="text-6xl">{icons[condition.toLowerCase()] || icons.default}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
      {/* Background Image Hero Section */}
      <div 
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')"
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Content Container */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header Section */}
          <header className="flex justify-between items-start p-6 md:p-8">
            {/* Location and Time */}
            <div className="text-white">
              <h1 className="text-4xl md:text-6xl font-light mb-2">
                {currentWeather.city}<span className="text-gray-300">, {currentWeather.country}</span>
              </h1>
            </div>
            
            {/* Time Zone Info */}
            <div className="text-right text-white">
              <div className="flex items-center mb-2">
                <span className="mr-2">📍</span>
                <div>
                  <div className="text-sm font-light">FLORIDA, USA</div>
                  <div className="text-lg">20:15 pm</div>
                </div>
              </div>
            </div>
          </header>

          {/* Search Bar */}
          <div className="px-6 md:px-8 mb-8">
            <form onSubmit={handleSearch} className="max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for a city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full px-4 py-3 bg-white bg-opacity-20 backdrop-blur-md rounded-lg text-white placeholder-gray-300 border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                >
                  🔍
                </button>
              </div>
            </form>
          </div>

          {/* Navigation */}
          <nav className="px-6 md:px-8 mb-auto">
            <div className="flex space-x-8 text-white text-sm font-light">
              <button className="flex items-center space-x-2 border-b-2 border-white pb-1">
                <span>☀️</span>
                <span>WEATHER</span>
              </button>
              <button className="flex items-center space-x-2 opacity-70 hover:opacity-100 transition-opacity">
                <span>📰</span>
                <span>NEWS & EVENTS</span>
              </button>
              <button className="flex items-center space-x-2 opacity-70 hover:opacity-100 transition-opacity">
                <span>🖼️</span>
                <span>GALLERY (30)</span>
              </button>
            </div>
          </nav>

          {/* Latest Locations Button */}
          <div className="absolute top-1/2 right-6 md:right-8">
            <button className="bg-green-500 bg-opacity-80 backdrop-blur-md px-4 py-2 rounded-lg text-white text-sm font-medium hover:bg-opacity-100 transition-all flex items-center space-x-2">
              <span>📍</span>
              <span>LATEST LOCATIONS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Weather Information Section */}
      <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-10 backdrop-blur-md">
        <div className="px-6 md:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Current Weather */}
            <div className="text-white">
              <div className="flex items-center space-x-6 mb-6">
                <div className="text-8xl md:text-9xl font-thin">
                  {currentWeather.temperature}°
                </div>
                <div className="space-y-2">
                  <WeatherIcon condition={currentWeather.condition} />
                  <div className="text-xl">{currentWeather.windSpeed}mph</div>
                  <div className="text-lg opacity-75">{currentWeather.highTemp}° / {currentWeather.lowTemp}°</div>
                </div>
              </div>
              <div className="text-lg font-light opacity-90">
                {currentWeather.day.toUpperCase()} {currentWeather.date}
              </div>
            </div>

            {/* Weekly Forecast */}
            <div className="text-white">
              <div className="grid grid-cols-6 gap-4">
                {weeklyForecast.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-sm font-light opacity-75 mb-2">{day.day}</div>
                    <div className="text-2xl mb-2">{day.icon}</div>
                    <div className="text-lg font-medium">{day.temp}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements for Visual Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white opacity-20 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-white opacity-30 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white opacity-25 rounded-full animate-pulse delay-500"></div>
      </div>
    </div>
  );
}

export default App;
