import React from "react";

const AqiContent = ({ aqiData }) => {
  return (
    <div className="flex flex-row justify-between gap-4 w-full">
      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-gray-800">
            {aqiData?.list[0].main.aqi}
          </span>
        </div>
        <span className="text-gray-600 mt-2">Average AQI</span>
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
