import React from "react";

const WeatherContent = ({ weatherData }) => {
  return (
    <>
      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-medium text-gray-800">
            {weatherData?.main.temp}°C
          </span>
        </div>
        <span className="text-gray-600 mt-2">TEMPERATURE</span>
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-medium text-gray-800">
            {weatherData?.main.humidity}%
          </span>
        </div>
        <span className="text-gray-600 mt-2">HUMIDITY</span>
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-medium text-gray-800">
            {weatherData?.wind.speed} km/h
          </span>
        </div>
        <span className="text-gray-600 mt-2">WIND</span>
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-medium text-gray-800">
            {weatherData?.weather[0].main.toUpperCase()}
          </span>
        </div>
        <span className="text-gray-600 mt-2">CONDITION</span>
      </div>
    </>
  );
};

export default WeatherContent;
