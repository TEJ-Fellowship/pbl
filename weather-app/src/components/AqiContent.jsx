import React from "react";

const AqiContent = ({ aqiData }) => {
  const aqi = aqiData?.list[0].main.aqi;
  const getAqiColorClass = (aqi) => {
    switch (aqi) {
      case 1:
        return "text-green-600";
      case 2:
        return "text-lime-600";
      case 3:
        return "text-yellow-600";
      case 4:
        return "text-orange-600";
      case 5:
        return "text-red-600";
      default:
        return "text-gray-400"; // for aqi = 0 or undefined
    }
  };

  return (
    <div className="flex flex-row justify-between gap-4 w-full">
      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <span
            className={`text-3xl font-bold rounded ${getAqiColorClass(aqi)}`}
          >
            {aqiData?.list[0].main.aqi}
          </span>
        </div>
        <span className="text-gray-600 mt-2">AQI (0-5) </span>
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-gray-800">
            {aqiData?.list[0].components.co}
          </span>
        </div>
        <span className="text-gray-600 mt-2">CO</span>
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-gray-800">
            {aqiData?.list[0].components.nh3}
          </span>
        </div>
        <span className="text-gray-600 mt-2">
          NH<sub>3</sub>
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-gray-800">
            {aqiData?.list[0].components.so2}
          </span>
        </div>
        <span className="text-gray-600 mt-2">
          SO<sub>2</sub>
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-gray-800">
            {aqiData?.list[0].components.o3}
          </span>
        </div>
        <span className="text-gray-600 mt-2">
          O<sub>3</sub>
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-gray-800">
            {aqiData?.list[0].components.no2}
          </span>
        </div>
        <span className="text-gray-600 mt-2">
          NO<sub>2</sub>
        </span>
      </div>
    </div>
  );
};

export default AqiContent;
