import { useState, useEffect } from "react";
import { socket } from "../src/utils/socket.js";

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocationErrorMessage = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location access denied by user";
      case error.POSITION_UNAVAILABLE:
        return "GPS unavailable, using approximate location";
      case error.TIMEOUT:
        return "GPS timed out, using approximate location";
      default:
        return "GPS failed, using approximate location";
    }
  };

  // Fallback: Get location from IP address
  const getLocationFromIP = async (showAsError = false) => {
    try {
      setIsLoading(true);
      if (!showAsError) setLocationError(null);

      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();

      if (data.latitude && data.longitude) {
        const locationData = {
          latitude: data.latitude,
          longitude: data.longitude,
          address: `${data.city}, ${data.region}`,
          city: data.city || "Unknown city",
          country: data.country_name || "Unknown country",
          timestamp: new Date().toISOString(),
          isIPLocation: true, // Flag to indicate this is from IP
        };

        setLocation(locationData);
        if (!showAsError) setLocationError(null);
        socket.emit("updateLocation", locationData);
        console.log(
          "Location obtained from IP:",
          locationData.city,
          locationData.country
        );
      } else {
        setLocationError("Could not determine location");
      }
    } catch (error) {
      console.error("Error getting location from IP:", error);
      setLocationError("Could not determine location");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setIsLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      // Automatically fallback to IP location
      getLocationFromIP();
      return;
    }

    // Try with high accuracy first, then fallback to low accuracy
    const tryGetLocation = (enableHighAccuracy = true) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Simple reverse geocoding using a free service
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();

            const locationData = {
              latitude,
              longitude,
              address:
                data.locality ||
                `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              city: data.city || data.locality || "Unknown city",
              country: data.countryName || "Unknown country",
              timestamp: new Date().toISOString(),
              isIPLocation: false,
            };

            setLocation(locationData);
            setLocationError(null);

            // Send location to server via socket
            socket.emit("updateLocation", locationData);
            console.log(
              "GPS location obtained:",
              locationData.city,
              locationData.country
            );
          } catch (error) {
            console.error("Error getting address:", error);
            const locationData = {
              latitude,
              longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              city: "Unknown city",
              country: "Unknown country",
              timestamp: new Date().toISOString(),
              isIPLocation: false,
            };

            setLocation(locationData);
            setLocationError(null);
            socket.emit("updateLocation", locationData);
          }

          setIsLoading(false);
        },
        (error) => {
          console.error("GPS Error:", error);

          // If high accuracy failed, try with low accuracy
          if (enableHighAccuracy && error.code === error.POSITION_UNAVAILABLE) {
            console.log("High accuracy failed, trying with low accuracy...");
            tryGetLocation(false);
            return;
          }

          // If all GPS attempts failed, automatically use IP location
          console.log(
            "All GPS attempts failed, falling back to IP location..."
          );
          const errorMessage = getLocationErrorMessage(error);
          setLocationError(errorMessage);

          // Automatically get IP location as fallback
          getLocationFromIP(true);
        },
        {
          enableHighAccuracy,
          timeout: enableHighAccuracy ? 10000 : 20000,
          maximumAge: 300000, // 5 minutes
        }
      );
    };

    tryGetLocation(true);
  };

  useEffect(() => {
    // Get location when socket connects
    if (socket.connected) {
      getCurrentLocation();
    }

    socket.on("connect", () => {
      getCurrentLocation();
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  return {
    location,
    locationError,
    isLoading,
    refreshLocation: getCurrentLocation,
    getLocationFromIP: () => getLocationFromIP(false),
  };
};
