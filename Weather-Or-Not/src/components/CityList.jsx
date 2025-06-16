import React from 'react';

const CityList = ({ cities, onCitySelect }) => {
  if (!cities || cities.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cities.map((city) => (
        <div
          key={`${city.name}-${city.country}`}
          onClick={() => onCitySelect(city)}
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        >
          <h3 className="font-semibold text-lg">{city.name}</h3>
          <p className="text-gray-600">{city.state || city.country}</p>
          <div className="mt-2 text-sm text-gray-500">
            <p>Lat: {city.lat.toFixed(2)}</p>
            <p>Lon: {city.lon.toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CityList;