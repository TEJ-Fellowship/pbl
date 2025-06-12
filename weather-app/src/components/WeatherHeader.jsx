import React, { useEffect, useState } from "react";

const WeatherHeader = ({ weatherData, localTime, country }) => {
  const [localTimeClock, setLocalTimeClock] = useState(null);

  return (
    <>
      <div className="absolute top-6 left-8 text-white">
        <h1 className="text-4xl font-light">{weatherData?.name}</h1>
      </div>
      <div className="absolute top-6 right-8 text-white flex flex-col items-end">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3"
            />
            <circle
              cx={12}
              cy={12}
              r={10}
              stroke="currentColor"
              strokeWidth={2}
              fill="none"
            />
          </svg>
          <span className="text-xs font-semibold">
            {country.toUpperCase()}, {weatherData?.name}
          </span>
        </div>
        {localTime && (
          <span className="text-lg font-semibold">{localTime}</span>
        )}
      </div>
    </>
  );
};

export default WeatherHeader;
