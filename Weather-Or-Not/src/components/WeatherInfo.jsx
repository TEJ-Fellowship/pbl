import { useState, useEffect } from "react";
import { foreCast } from "../services/weather_api";
import {
  getTime,
  formatPressure,
  formatVisibility,
  getPressureDescription
} from "../utils/getHeperFunc";

import { airPollution } from "../services/air-quality_api";
import AirQuality from "./AirQuality";
import axios from "axios";
const api_key = import.meta.env.VITE_WEATHER_API_KEY;
import { toast } from "sonner";

import {
  Thermometer,
  Wind,
  Droplets,
  Sunrise,
  Sunset,
  Loader2,
  Cloud,
  Eye,
  Compass,
  Gauge,
  ArrowUp
} from "lucide-react";

const WeatherInfo = ({ selectedCity }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [airQuality, setAirQuality] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!selectedCity) return;
      setIsLoading(true);
      try {
        // Get current weather
        const currentResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${selectedCity.lat}&lon=${selectedCity.lon}&units=metric&appid=${api_key}`
        );
        setCurrentWeather(currentResponse.data);

        const forecastData = await foreCast(selectedCity.lat, selectedCity.lon);
        setWeatherData(forecastData);
        const airQualityData = await airPollution(
          selectedCity.lat,
          selectedCity.lon
        );
        setAirQuality(airQualityData);
      } catch (error) {
        toast.error(`Error fetching weather data: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWeather();
  }, [selectedCity]);

  if (!selectedCity) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading weather data...</span>
      </div>
    );
  }

  if (!currentWeather || !weatherData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Weather data not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-gray-800">
        Weather Information
      </h3>

      {/* Main Weather Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">{selectedCity.name}</h2>
            <p className="text-blue-100">{selectedCity.country}</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-800">
              {currentWeather.main.temp}°C
            </p>
            <p className="text-gray-600 capitalize">
              {currentWeather.weather[0].description}
            </p>
            <p className="text-sm text-gray-500">
              Feels like: {currentWeather.main.feels_like}°C
            </p>
          </div>
          {currentWeather.weather[0].icon && (
            <img
              src={`https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`}
              alt="Weather icon"
              className="w-20 h-20"
            />
          )}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Max: {currentWeather.main.temp_max}°C</span>
          <span>Min: {currentWeather.main.temp_min}°C</span>
        </div>
      </div>

      {/* Temperature Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Thermometer className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-gray-800">Temperature</p>
            <p className="text-gray-600">{currentWeather.main.temp}°C</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Droplets className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-gray-800">Humidity</p>
            <p className="text-gray-600">{currentWeather.main.humidity}%</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Gauge className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-gray-800">Pressure</p>
            <p className="text-gray-600">
              {formatPressure(currentWeather.main.pressure)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Wind className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-gray-800">Wind Speed</p>
            <p className="text-gray-600">{currentWeather.wind.speed} m/s</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Compass className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-gray-800">Wind Direction</p>
            <p className="text-gray-600">{currentWeather.wind.deg}°</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Cloud className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-gray-800">Cloudiness</p>
            <p className="text-gray-600">{currentWeather.clouds.all}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Eye className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-gray-800">Visibility</p>
            <p className="text-gray-600">
              {formatVisibility(currentWeather.visibility)} {/* "10.0 km" */}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
          <Sunrise className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="font-medium text-gray-800">Sunrise</p>
            <p className="text-gray-600">
              {getTime(currentWeather.sys.sunrise, currentWeather.timezone)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
          <Sunset className="w-6 h-6 text-orange-600" />
          <div>
            <p className="font-medium text-gray-800">Sunset</p>
            <p className="text-gray-600">
              {getTime(currentWeather.sys.sunset, currentWeather.timezone)}
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Section */}
      <div className="mt-6">
        <h4 className="text-xl font-semibold text-gray-800 mb-4">
          5-Day Forecast
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {weatherData.list
            .filter((_, index) => index % 8 === 0)
            .map((item, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <p className="font-medium">
                  {new Date(item.dt * 1000).toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </p>
                <img
                  src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                  alt={item.weather[0].description}
                  className="mx-auto my-2"
                />
                <div className="flex justify-between">
                  <span className="text-gray-800 font-medium">
                    {Math.round(item.main.temp_max)}°
                  </span>
                  <span className="text-gray-500">
                    {Math.round(item.main.temp_min)}°
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
      {/* Sea Level Pressure Card */}
  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
      <ArrowUp className="w-5 h-5" />
    </div>
    <div>
      <p className="font-medium text-gray-800">Sea Level Pressure</p>
      <p className="text-gray-600">
        {currentWeather.main.sea_level 
          ? `${currentWeather.main.sea_level} hPa`
          : 'N/A'}
      </p>
      {currentWeather.main.sea_level && (
        <p className="text-xs text-gray-500 mt-1">
          {getPressureDescription(currentWeather.main.sea_level)}
        </p>
      )}
    </div>
  </div>
      {/* Add Air Quality section */}
      {airQuality && <AirQuality aqiData={airQuality} />}
      {/* Additional Weather Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">
          Additional Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Weather ID:</span>{" "}
              {currentWeather.weather[0].id}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Weather Main:</span>{" "}
              {currentWeather.weather[0].main}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Country Code:</span>{" "}
              {currentWeather.country}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Last Updated:</span>{" "}
              {new Date(currentWeather.dt * 1000).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherInfo;
