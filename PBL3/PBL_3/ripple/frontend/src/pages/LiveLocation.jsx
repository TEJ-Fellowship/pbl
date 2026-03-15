import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Users,
  Eye,
  EyeOff,
  RefreshCw,
  Navigation,
} from "lucide-react";
import { socket } from "../utils/socket.js";
import { useLocation } from "../../hooks/useLocation.js";
import { useAuth } from "../context/authContext.jsx";

const LiveUsersMap = () => {
  const { location: myLocation } = useLocation();
  const userData = useAuth();
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Listen for connected users with locations
    socket.on("usersLocationUpdate", (users) => {
      setConnectedUsers(
        users.filter((user) => user.userId !== userData?.user?.userId)
      );
    });

    // Request current connected users when component mounts
    socket.emit("getConnectedUsers");

    return () => {
      socket.off("usersLocationUpdate");
    };
  }, [userData]);

  // Toggle visibility on the map
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    socket.emit("toggleLocationVisibility", !isVisible);
  };

  if (!myLocation) {
    return (
      <div className="bg-gray-800 bg-opacity-20 border border-gray-700 rounded-lg p-6 text-center">
        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-400">Enable location to see friends on map</p>
      </div>
    );
  }

  // Calculate map bounds to include all users
  const allLocations = [
    myLocation,
    ...connectedUsers.filter((u) => u.location),
  ];
  const bounds =
    allLocations.length > 1
      ? {
          minLat:
            Math.min(
              ...allLocations.map((l) => l.location?.latitude || l.latitude)
            ) - 0.005,
          maxLat:
            Math.max(
              ...allLocations.map((l) => l.location?.latitude || l.latitude)
            ) + 0.005,
          minLng:
            Math.min(
              ...allLocations.map((l) => l.location?.longitude || l.longitude)
            ) - 0.005,
          maxLng:
            Math.max(
              ...allLocations.map((l) => l.location?.longitude || l.longitude)
            ) + 0.005,
        }
      : {
          minLat: myLocation.latitude - 0.01,
          maxLat: myLocation.latitude + 0.01,
          minLng: myLocation.longitude - 0.01,
          maxLng: myLocation.longitude + 0.01,
        };

  // Create markers for the map URL
  const createMapMarkers = () => {
    let markers = [];

    // Add my location marker
    markers.push(`${myLocation.latitude},${myLocation.longitude}`);

    // Add other users' markers
    connectedUsers
      .filter((user) => user.location)
      .forEach((user) => {
        markers.push(`${user.location.latitude},${user.location.longitude}`);
      });

    return markers.join("|");
  };

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}&layer=mapnik`;

  return (
    <div className="bg-gray-800 bg-opacity-20 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-medium">Live Map</h3>
            <span className="text-gray-400 text-sm">
              {connectedUsers.filter((u) => u.location).length} friends online
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVisibility}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors ${
                isVisible
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              {isVisible ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
              {isVisible ? "Visible" : "Hidden"}
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-96 bg-gray-700">
        {/* Custom Map with Accurate Markers */}
        <div
          ref={mapRef}
          className="w-full h-full relative overflow-hidden"
          style={{
            backgroundImage: `url('https://tile.openstreetmap.org/${
              Math.floor(((bounds.minLng + bounds.maxLng) / 2) * 1000) % 100
            }/${
              Math.floor(((bounds.minLat + bounds.maxLat) / 2) * 1000) % 100
            }/10.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Use Google Maps for better accuracy */}
          <iframe
            src={`https://maps.google.com/maps?q=${myLocation.latitude},${myLocation.longitude}&hl=en&z=14&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0, filter: "invert(1) hue-rotate(180deg)" }}
            loading="lazy"
            className="w-full h-full"
          />

          {/* Overlay for custom markers */}
          <div className="absolute inset-0 pointer-events-none">
            {/* My Location - Center of the map */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20"
              style={{
                left: "50%",
                top: "50%",
              }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-blue-500 border-3 border-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  You
                  {myLocation.isIPLocation && (
                    <span className="ml-1 text-orange-400">~</span>
                  )}
                </div>
                {/* Accuracy circle for IP location */}
                {myLocation.isIPLocation && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-orange-400 border-dashed rounded-full opacity-50 -z-10"></div>
                )}
              </div>
            </div>

            {/* Calculate positions for other users relative to my location */}
            {connectedUsers
              .filter((user) => user.location)
              .map((user) => {
                // Calculate approximate pixel offset from center
                const latDiff = user.location.latitude - myLocation.latitude;
                const lngDiff = user.location.longitude - myLocation.longitude;

                // Rough conversion (this varies by latitude, but good enough for display)
                const pixelPerDegree = 3600; // Approximate pixels per degree at zoom level 14
                const offsetX =
                  lngDiff *
                  pixelPerDegree *
                  Math.cos((myLocation.latitude * Math.PI) / 180);
                const offsetY = -latDiff * pixelPerDegree; // Negative because map Y increases downward

                return (
                  <div
                    key={user.userId}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer z-10"
                    style={{
                      left: `calc(50% + ${Math.min(
                        Math.max(offsetX, -180),
                        180
                      )}px)`,
                      top: `calc(50% + ${Math.min(
                        Math.max(offsetY, -180),
                        180
                      )}px)`,
                    }}
                    onClick={() =>
                      setSelectedUser(
                        selectedUser?.userId === user.userId ? null : user
                      )
                    }
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <span className="text-white font-medium text-xs">
                          {user.username?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      {selectedUser?.userId === user.userId && (
                        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white text-xs p-2 rounded whitespace-nowrap z-30 min-w-32">
                          <p className="font-medium">{user.username}</p>
                          <p className="text-gray-300">{user.location.city}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(
                              user.location.timestamp
                            ).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                      {user.location.isIPLocation && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full border border-white"></div>
                      )}
                      {/* Accuracy circle for IP locations */}
                      {user.location.isIPLocation && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-orange-400 border-dashed rounded-full opacity-30 -z-10"></div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
            <button
              onClick={() =>
                window.open(
                  `https://www.google.com/maps?q=${myLocation.latitude},${myLocation.longitude}`,
                  "_blank"
                )
              }
              className="bg-black bg-opacity-75 text-white p-2 rounded-lg hover:bg-opacity-90 transition-colors"
              title="Open in Google Maps"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="p-4 border-t border-gray-700 max-h-32 overflow-y-auto">
        <div className="space-y-2">
          {connectedUsers.filter((user) => user.location).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-2">
              No friends are sharing their location
            </p>
          ) : (
            connectedUsers
              .filter((user) => user.location)
              .map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded cursor-pointer"
                  onClick={() =>
                    setSelectedUser(
                      selectedUser?.userId === user.userId ? null : user
                    )
                  }
                >
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-xs">
                      {user.username?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {user.username}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {user.location.city}, {user.location.country}
                      {user.location.isIPLocation && (
                        <span className="ml-2 text-orange-400">~</span>
                      )}
                    </p>
                  </div>
                  <p className="text-gray-500 text-xs">
                    {new Date(user.location.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveUsersMap;
