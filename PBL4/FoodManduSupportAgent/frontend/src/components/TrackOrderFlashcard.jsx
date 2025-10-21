import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Clock, MapPin, User, Phone, Car, X, Navigation } from "lucide-react";

// Fix for default markers in react-leaflet
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom delivery person icon
const deliveryIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EAB308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#FEF08A"/>
      <path d="M12 8v8m-4-4h8"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Destination icon
const destinationIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#EF4444" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

export default function TrackOrderFlashcard({
  orderId,
  restaurantLocation,
  onClose,
}) {
  const { t } = useTranslation();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState("prompt"); // 'prompt', 'granted', 'denied'
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const mapRef = useRef(null);
  const prevLocationRef = useRef(null);

  // Request user location
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsRequestingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(userCoords);
        setLocationPermission("granted");
        setIsRequestingLocation(false);
        console.log("✅ User location obtained:", userCoords);
      },
      (error) => {
        console.error("❌ Error getting location:", error);
        setLocationPermission("denied");
        setIsRequestingLocation(false);
        // Fallback to default location (Kathmandu area)
        setUserLocation({
          lat: 27.71,
          lng: 85.33,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Request location on component mount
  useEffect(() => {
    requestUserLocation();
  }, []);

  // Fetch tracking data
  useEffect(() => {
    if (!orderId) return;

    const fetchTrackingData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build URL with user location if available
        let url = `http://localhost:5000/api/track?orderId=${orderId}&restaurantLocation=${
          restaurantLocation || ""
        }`;

        if (userLocation) {
          url += `&userLat=${userLocation.lat}&userLng=${userLocation.lng}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch tracking data");
        }

        const result = await response.json();

        if (result.success) {
          setTrackingData(result.data);
        } else {
          throw new Error(result.error || "Failed to track order");
        }
      } catch (err) {
        console.error("Error fetching tracking data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();

    // Poll for updates every 5 seconds for real-time tracking
    const interval = setInterval(fetchTrackingData, 5000);
    return () => clearInterval(interval);
  }, [orderId, restaurantLocation, userLocation]);

  // Update map view when tracking data changes
  useEffect(() => {
    if (trackingData && mapRef.current && trackingData.currentStage >= 3) {
      const map = mapRef.current;
      // Center on delivery person
      map.setView([trackingData.location.lat, trackingData.location.lng], 15);
    }
  }, [trackingData]);

  if (!orderId) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg mt-4">
        <div className="text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">{t("pleaseProvideOrderDetails")}</p>
        </div>
      </div>
    );
  }

  if (loading && !trackingData) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg mt-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">{t("calculating")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-lg mt-4">
        <div className="text-center text-red-600">
          <X className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return null;
  }

  const progressSteps = [
    { key: "orderPlaced", name: t("orderPlaced") },
    { key: "orderPreparing", name: t("orderPreparing") },
    { key: "orderReady", name: t("orderReady") },
    { key: "orderOnWay", name: t("orderOnWay") },
    { key: "orderDelivered", name: t("orderDelivered") },
  ];

  const currentStepIndex = trackingData.currentStage;
  const showLiveMap = currentStepIndex >= 3; // Show map when "Order is on the Way" or delivered

  // Use road route from backend if available, otherwise fallback to straight line
  const routeCoordinates = showLiveMap
    ? trackingData.roadRoute || [
        [trackingData.restaurant.lat, trackingData.restaurant.lng],
        [trackingData.location.lat, trackingData.location.lng],
        [trackingData.destination.lat, trackingData.destination.lng],
      ]
    : [];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg mt-4 relative">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Location Permission Banner */}
      {locationPermission === "denied" && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900">
                {t("locationAccessDenied")}
              </p>
              <p className="text-xs text-orange-700 mt-1">
                {t("locationAccessDeniedDesc")}
              </p>
              <button
                onClick={requestUserLocation}
                className="mt-2 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded transition-colors"
              >
                {t("tryAgain")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRequestingLocation && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-900">{t("requestingLocation")}</p>
          </div>
        </div>
      )}

      {locationPermission === "granted" && userLocation && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Navigation className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-900">
              ✓ {t("trackingToYourLocation")}: {userLocation.lat.toFixed(4)},{" "}
              {userLocation.lng.toFixed(4)}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
          <MapPin className="w-5 h-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">
            {t("liveOrderTracking")}
          </h3>
          <p className="text-sm text-gray-600">
            {trackingData.orderNumber || trackingData.orderId}
          </p>
          {trackingData.restaurantName && (
            <p className="text-xs text-gray-500">
              🏪 {trackingData.restaurantName}
            </p>
          )}
        </div>
      </div>

      {/* Order Items Summary */}
      {trackingData.items && trackingData.items.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">
            📦 Order Items ({trackingData.items.length})
          </h4>
          <div className="space-y-1">
            {trackingData.items.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-gray-600 font-medium">
                  Rs. {item.price}
                </span>
              </div>
            ))}
            {trackingData.items.length > 3 && (
              <p className="text-xs text-gray-500 italic">
                +{trackingData.items.length - 3} more item(s)
              </p>
            )}
          </div>
          {trackingData.total && (
            <div className="mt-2 pt-2 border-t border-gray-300 flex justify-between items-center font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-yellow-600">Rs. {trackingData.total}</span>
            </div>
          )}
        </div>
      )}

      {/* Map - Show real map only when order is on the way */}
      <div className="mb-4">
        <div className="h-64 w-full rounded-lg border border-gray-200 overflow-hidden relative">
          {showLiveMap ? (
            <MapContainer
              ref={mapRef}
              center={[trackingData.location.lat, trackingData.location.lng]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Route line - blue color for better visibility */}
              <Polyline
                positions={routeCoordinates}
                pathOptions={{
                  color: "#3B82F6",
                  weight: 5,
                  opacity: 0.8,
                }}
              />

              {/* Restaurant marker (start point) */}
              <Marker
                position={[
                  trackingData.restaurant.lat,
                  trackingData.restaurant.lng,
                ]}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">
                      🏪 {trackingData.restaurantName || "Restaurant"}
                    </p>
                    <p className="text-xs">{trackingData.restaurantLocation}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Delivery person marker (moving) */}
              <Marker
                position={[
                  trackingData.location.lat,
                  trackingData.location.lng,
                ]}
                icon={deliveryIcon}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">
                      🚴 {trackingData.driver.name}
                    </p>
                    <p className="text-xs">{trackingData.driver.vehicle}</p>
                    <p className="text-xs text-green-600">● Live Location</p>
                  </div>
                </Popup>
              </Marker>

              {/* Destination marker (your location) */}
              <Marker
                position={[
                  trackingData.destination.lat,
                  trackingData.destination.lng,
                ]}
                icon={destinationIcon}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">📍 Your Location</p>
                    <p className="text-xs">Delivery Destination</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="h-full bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
              <div className="text-center text-gray-600">
                <Clock className="w-16 h-16 mx-auto mb-3 text-yellow-500 animate-pulse" />
                <p className="text-lg font-semibold mb-1">
                  Preparing Your Order
                </p>
                <p className="text-sm">
                  Live tracking will be available once delivery starts
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Live indicator badge */}
          {showLiveMap && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg z-10">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </div>
          )}
        </div>
      </div>

      {/* ETA */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
        <Clock className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="font-semibold text-blue-900">
            {t("eta")}: {trackingData.eta} {t("minutes")}
          </p>
          <p className="text-sm text-blue-700">{trackingData.status}</p>
        </div>
        {showLiveMap && (
          <Navigation className="w-5 h-5 text-blue-600 animate-pulse" />
        )}
      </div>

      {/* Progress Steps */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <div className="w-6 h-1 bg-yellow-500 rounded-full"></div>
          Delivery Progress
        </h4>
        <div className="space-y-2">
          {progressSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const stepData = trackingData.progress.steps[index];

            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isCurrent
                    ? "bg-yellow-100 text-yellow-800 font-semibold shadow-sm border-2 border-yellow-300"
                    : isCompleted
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                    isCurrent
                      ? "bg-yellow-500 text-white animate-pulse"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {isCompleted ? "✓" : isCurrent ? "●" : index + 1}
                </div>
                <div className="flex-1">
                  <span className="text-sm block">{step.name}</span>
                  {stepData.timestamp && (
                    <span className="text-xs opacity-75">
                      {new Date(stepData.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <span className="text-xs bg-yellow-200 px-2 py-1 rounded-full">
                    In Progress
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Driver Information */}
      {showLiveMap && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            {t("driverInfo")}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{trackingData.driver.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <a
                href={`tel:${trackingData.driver.phone}`}
                className="text-blue-600 hover:underline"
              >
                {trackingData.driver.phone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {trackingData.driver.vehicle}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {trackingData.driver.vehicleNumber}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <p>
            Stage: {currentStepIndex + 1}/5 | Elapsed:{" "}
            {trackingData.elapsedMinutes}min | ETA: {trackingData.eta}min
          </p>
          <p>
            Location: [{trackingData.location.lat.toFixed(4)},{" "}
            {trackingData.location.lng.toFixed(4)}]
          </p>
        </div>
      )}
    </div>
  );
}
