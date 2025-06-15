import React, { useState } from "react";

const WeatherContent = ({ weatherData }) => {
  const [isKelvin, setIsKelvin] = useState(false);

  const celsius = weatherData?.main.temp;
  const kelvin = celsius + 273;

  return (
    <>
      <div className="flex flex-row justify-between gap-4 w-full">
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-gray-800">
              {isKelvin ? kelvin : celsius}
              <sup>{isKelvin ? "K" : "C"}</sup>
            </span>
          </div>
          <span className="text-gray-600 mt-2">
            TEMP{" "}
            <span
              onClick={() => setIsKelvin((prev) => !prev)}
              className="hover:cursor-pointer"
            >
              {isKelvin ? (
                <svg
                  className="inline"
                  width="32"
                  height="12"
                  viewBox="0 0 100 60"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="0"
                    y="0"
                    rx="30"
                    ry="30"
                    width="100"
                    height="60"
                    fill="#222"
                  />
                  <circle cx="70" cy="30" r="24" fill="#ddd" />
                </svg>
              ) : (
                <svg
                  className="inline"
                  width="32"
                  height="12"
                  viewBox="0 0 100 60"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="0"
                    y="0"
                    rx="30"
                    ry="30"
                    width="100"
                    height="60"
                    fill="#222"
                  />
                  <circle cx="30" cy="30" r="24" fill="#ddd" />
                </svg>
              )}
            </span>
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-gray-800">
              {weatherData?.main.humidity}%
            </span>
          </div>
          <span className="text-gray-600 mt-2">HUMIDITY</span>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-gray-800">
              {weatherData?.wind.speed} KM/H
            </span>
          </div>
          <span className="text-gray-600 mt-2">WIND</span>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-gray-800">
              {weatherData?.weather[0].main.toUpperCase()}
            </span>
          </div>
          <span className="text-gray-600 mt-2">CONDITION</span>
        </div>
      </div>
    </>
  );
};

export default WeatherContent;
