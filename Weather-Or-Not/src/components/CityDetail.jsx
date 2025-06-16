import { MapPin, Globe2 } from "lucide-react";

const CityDetail = ({ city }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-lg">
      <h2 className="text-3xl font-bold mb-2">{city.name}</h2>
      <div className="flex items-center gap-2 text-blue-100">
        <Globe2 className="w-5 h-5" />
        <p className="text-lg">{city.country}</p>
      </div>
      {city.state && (
        <p className="text-blue-200 text-sm mt-1">{city.state}</p>
      )}
      <div className="mt-4 flex items-center gap-2 text-blue-100">
        <MapPin className="w-5 h-5" />
        <p className="text-sm">
          {city.lat.toFixed(4)}°, {city.lon.toFixed(4)}°
        </p>
      </div>
    </div>
  );
};

export default CityDetail;