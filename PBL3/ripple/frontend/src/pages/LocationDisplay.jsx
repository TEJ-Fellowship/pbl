import React, { useState } from "react";
import { MapPin, RefreshCw, Map, X, Wifi } from "lucide-react";
import { useLocation } from "../../hooks/useLocation.js";

const LocationDisplay = () => {
  const {
    location,
    locationError,
    isLoading,
    refreshLocation,
    getLocationFromIP,
  } = useLocation();
  const [showMap, setShowMap] = useState(false);

  if (locationError) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-red-400 mt-0.5" />
          <div className="flex-1">
            <span className="text-red-400 text-sm block">{locationError}</span>
            <div className="flex gap-2 mt-2">
              <button
                onClick={refreshLocation}
                className="text-red-400 hover:text-red-300 text-xs underline"
                disabled={isLoading}
              >
                {isLoading ? "Retrying..." : "Try Again"}
              </button>
              <button
                onClick={getLocationFromIP}
                className="text-orange-400 hover:text-orange-300 text-xs underline flex items-center gap-1"
                disabled={isLoading}
              >
                <Wifi className="w-3 h-3" />
                Use IP Location
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-400 text-sm">
            Getting your location...
          </span>
        </div>
      </div>
    );
  }

  if (!location) return null;

  return (
    <>
      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-5 h-5 text-green-400 flex-shrink-0" />
            {location.isIPLocation && (
              <Wifi
                className="w-3 h-3 text-orange-400"
                title="Location from IP address"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white font-medium text-sm truncate">
                {location.city}, {location.country}
              </p>
              <button
                onClick={() => setShowMap(true)}
                className="text-green-400 hover:text-green-300 transition-colors"
                title="Show on map"
              >
                <Map className="w-3 h-3" />
              </button>
              <button
                onClick={refreshLocation}
                className="text-green-400 hover:text-green-300 transition-colors"
                title="Refresh location"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            <p className="text-gray-300 text-xs truncate">{location.address}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-500 text-xs">
                Updated {new Date(location.timestamp).toLocaleTimeString()}
              </p>
              {location.isIPLocation && (
                <span className="text-orange-400 text-xs bg-orange-500/10 px-1.5 py-0.5 rounded">
                  Approximate
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-medium">Your Location</h3>
                {location.isIPLocation && (
                  <span className="text-orange-400 text-xs bg-orange-500/10 px-2 py-1 rounded">
                    Approximate
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowMap(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Map Container */}
            <div className="relative">
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  location.longitude - 0.01
                },${location.latitude - 0.01},${location.longitude + 0.01},${
                  location.latitude + 0.01
                }&layer=mapnik&marker=${location.latitude},${
                  location.longitude
                }`}
                width="100%"
                height="400"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />

              {/* Location Info Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium text-sm">
                        {location.city}, {location.country}
                      </p>
                      {location.isIPLocation && (
                        <span className="text-orange-400 text-xs bg-orange-500/20 px-1.5 py-0.5 rounded">
                          ~
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-xs truncate">
                      {location.address}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {location.latitude.toFixed(6)},{" "}
                      {location.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={refreshLocation}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg font-medium transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    {isLoading ? "Updating..." : "GPS Location"}
                  </button>
                  {!location.isIPLocation && (
                    <button
                      onClick={getLocationFromIP}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white rounded-lg font-medium transition-colors"
                    >
                      <Wifi className="w-4 h-4" />
                      IP Location
                    </button>
                  )}
                </div>
                <button
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
                      "_blank"
                    )
                  }
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Open in Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LocationDisplay;
