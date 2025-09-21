import React from "react";
import LiveUsersMap from "./LiveLocation.jsx";
import LocationDisplay from "./LocationDisplay.jsx";

const MapPage = () => {
  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundImage:
          "radial-gradient(circle, #043317, #072b15, #092412, #081c0f, #05150a, #071004, #070a01, #030300, #030200, #030100, #020000, #000000)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="p-8 pb-6">
          <h1 className="text-3xl font-bold text-white text-center">
            Snap Map
          </h1>
          <p className="text-gray-400 text-center mt-2">
            See where your friends are in real-time
          </p>
        </div>

        {/* My Location Display */}
        <div className="mb-6">
          <LocationDisplay />
        </div>

        {/* Live Users Map */}
        <LiveUsersMap />
      </div>
    </div>
  );
};

export default MapPage;
