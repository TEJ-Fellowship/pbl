import React from 'react';

const CityInfo = ({ cityInfoData, loading, error }) => {
  return (
    <div className="flex flex-row justify-between gap-4 w-full">
      {loading && (
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <span className="text-gray-600 mt-2">LOADING</span>
        </div>
      )}
      
      {error && (
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <span className="text-gray-600 mt-2">ERROR</span>
        </div>
      )}

      {!loading && !error && !cityInfoData && (
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🏙️</span>
          </div>
          <span className="text-gray-600 mt-2">SEARCH A CITY</span>
        </div>
      )}      {!loading && !error && cityInfoData && (
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4 px-4 max-w-3xl">
            <span className="text-lg text-gray-800 text-center line-clamp-2">
              {cityInfoData.information}
            </span>
          </div>
          {/* <span className="text-gray-600 mt-2">{cityInfoData.city.toUpperCase()}</span> */}
        </div>
      )}
    </div>
  );
};

export default CityInfo;