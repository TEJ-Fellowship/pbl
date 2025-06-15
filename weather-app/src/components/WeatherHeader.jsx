import React, { useEffect, useState } from "react";

const WeatherHeader = ({
  weatherData,
  country,
  onShowChart,
  getCityLocalTime,
}) => {
  const [liveTime, setLiveTime] = useState(null);

  useEffect(() => {
    if (weatherData && typeof weatherData.timezone === "number") {
      const interval = setInterval(() => {
        setLiveTime(getCityLocalTime(weatherData.timezone));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [weatherData]);

  return (
    <>
      <div className="absolute top-6 left-8 text-white">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-light">{weatherData?.name}</h1>
          {weatherData?.name && (
            <button
              onClick={() => onShowChart(weatherData.name)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200 hover:scale-110"
              title="View temperature trend"
            >
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </button>
          )}
        </div>
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
        {liveTime && <span className="text-lg font-semibold">{liveTime}</span>}
      </div>
    </>
  );
};

export default WeatherHeader;
