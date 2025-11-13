/**
 * Tool Result View Component
 * Shows results based on selected MCP tool
 */

import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Clock,
  MapPin,
  User,
  Phone,
  Car,
  X,
  Navigation,
  Package,
  CheckCircle,
  Route,
  BarChart3,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import MapUpdater from "./MapUpdater.jsx";

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

// Custom icons
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

export default function ToolResultView({
  selectedTool,
  toolData,
  orderId,
  loading,
  error,
  onBack,
  onClose,
}) {
  const { t } = useTranslation();

  // Render based on selected tool
  const renderToolResult = () => {
    if (loading || !toolData) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600">Error: {error}</p>
        </div>
      );
    }

    switch (selectedTool) {
      case "get_all_details":
        return <AllDetailsView data={toolData} orderId={orderId} />;
      case "get_order_status":
        return <OrderStatusView data={toolData} />;
      case "get_location_tracking":
        return <LocationTrackingView data={toolData} />;
      case "calculate_eta":
        return <ETAView data={toolData} />;
      case "get_order_details":
        return <OrderDetailsView data={toolData} />;
      case "get_driver_info":
        return <DriverInfoView data={toolData} />;
      case "get_progress_tracking":
        return <ProgressTrackingView data={toolData} />;
      case "get_route_info":
        return <RouteInfoView data={toolData} />;
      default:
        return (
          <div className="text-center py-8 text-gray-500">Unknown tool</div>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg mt-4 relative">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to options
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {renderToolResult()}
    </div>
  );
}

// Individual tool views
function AllDetailsView({ data, orderId }) {
  const { t } = useTranslation();
  const mapRef = React.useRef(null);

  // Comprehensive view with everything - handle different data structures
  const trackingData = data?.comprehensive || data?.data || data;

  // Debug logging to understand data structure
  if (!trackingData) {
    console.warn("AllDetailsView: No tracking data available", { data });
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">No order details available</p>
        <p className="text-xs text-gray-400">
          Please try selecting the order again
        </p>
      </div>
    );
  }

  // Log the data structure for debugging
  console.log("AllDetailsView - trackingData:", trackingData);

  const showLiveMap = trackingData.currentStage >= 3;
  const routeCoordinates = trackingData.roadRoute || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
          <MapPin className="w-5 h-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">
            Complete Order Details - {trackingData.orderNumber || orderId}
          </h3>
          {trackingData.restaurantName && (
            <p className="text-xs text-gray-500">
              🏪 {trackingData.restaurantName}
            </p>
          )}
        </div>
      </div>

      {/* Map - Show if we have location data, even if not yet on the way */}
      {trackingData.location && trackingData.location.lat !== 0 && (
        <div className="mb-4">
          <div className="h-64 w-full rounded-lg border border-gray-200 overflow-hidden relative">
            <MapContainer
              ref={mapRef}
              key={`map-${trackingData.orderId}`} // Keep map instance stable
              center={
                trackingData.location?.lat && trackingData.location?.lng
                  ? [trackingData.location.lat, trackingData.location.lng]
                  : trackingData.restaurant?.lat && trackingData.restaurant?.lng
                  ? [trackingData.restaurant.lat, trackingData.restaurant.lng]
                  : [27.71, 85.33]
              }
              zoom={showLiveMap ? 15 : 13}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Map updater - only updates location without re-rendering */}
              <MapUpdater
                location={trackingData.location}
                center={
                  trackingData.restaurant
                    ? [trackingData.restaurant.lat, trackingData.restaurant.lng]
                    : null
                }
              />
              {routeCoordinates.length > 0 && (
                <Polyline
                  positions={routeCoordinates}
                  pathOptions={{
                    color: "#3B82F6",
                    weight: 5,
                    opacity: 0.8,
                  }}
                />
              )}
              {trackingData.restaurant && trackingData.restaurant.lat && (
                <Marker
                  position={[
                    trackingData.restaurant.lat,
                    trackingData.restaurant.lng,
                  ]}
                >
                  <Popup>
                    🏪{" "}
                    {trackingData.restaurantName ||
                      trackingData.restaurant.name ||
                      "Restaurant"}
                  </Popup>
                </Marker>
              )}
              {/* Delivery person marker - use key to force update on location change */}
              {trackingData.location &&
                trackingData.location.lat !== 0 &&
                (showLiveMap || trackingData.currentStage >= 3) && (
                  <Marker
                    key={`delivery-${trackingData.location.lat}-${trackingData.location.lng}`}
                    position={[
                      trackingData.location.lat,
                      trackingData.location.lng,
                    ]}
                    icon={deliveryIcon}
                  >
                    <Popup>
                      🚴 {trackingData.driver?.name || "Delivery Person"}
                    </Popup>
                  </Marker>
                )}
              {trackingData.destination && trackingData.destination.lat && (
                <Marker
                  position={[
                    trackingData.destination.lat,
                    trackingData.destination.lng,
                  ]}
                  icon={destinationIcon}
                >
                  <Popup>📍 Your Location</Popup>
                </Marker>
              )}
            </MapContainer>
            {showLiveMap && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg z-10">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
            )}
          </div>
        </div>
      )}
      {!showLiveMap && trackingData.location && (
        <div className="mb-4 h-32 bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center rounded-lg border border-gray-200">
          <div className="text-center text-gray-600">
            <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500 animate-pulse" />
            <p className="text-sm font-semibold">Preparing Your Order</p>
            <p className="text-xs">Map will appear when delivery starts</p>
          </div>
        </div>
      )}

      {/* ETA */}
      {trackingData.eta !== undefined && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
          <Clock className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="font-semibold text-blue-900">
              ETA: {trackingData.eta} minutes
            </p>
            <p className="text-sm text-blue-700">{trackingData.status}</p>
          </div>
        </div>
      )}

      {/* Order Items */}
      {trackingData.items && trackingData.items.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">
            📦 Order Items ({trackingData.items.length})
          </h4>
          <div className="space-y-1">
            {trackingData.items.map((item, index) => (
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
          </div>
          {trackingData.total && (
            <div className="mt-2 pt-2 border-t border-gray-300 flex justify-between items-center font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-yellow-600">Rs. {trackingData.total}</span>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {trackingData.progress?.steps && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            Delivery Progress
          </h4>
          <div className="space-y-2">
            {trackingData.progress.steps.map((step, index) => {
              const isCompleted = step.completed;
              const isCurrent = index === trackingData.currentStage;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isCurrent
                      ? "bg-yellow-100 border-2 border-yellow-300"
                      : isCompleted
                      ? "bg-green-50"
                      : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
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
                    {step.timestamp && (
                      <span className="text-xs opacity-75">
                        {new Date(step.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Driver Info */}
      {trackingData.driver && showLiveMap && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Driver Information
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
                {typeof trackingData.driver.vehicle === "object"
                  ? `${trackingData.driver.vehicle.type} - ${trackingData.driver.vehicle.model}`
                  : trackingData.driver.vehicle}
              </span>
            </div>
            {(typeof trackingData.driver.vehicle === "object"
              ? trackingData.driver.vehicle.number
              : trackingData.driver.vehicleNumber) && (
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {typeof trackingData.driver.vehicle === "object"
                    ? trackingData.driver.vehicle.number
                    : trackingData.driver.vehicleNumber}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderStatusView({ data }) {
  const statusData = data?.data || data;
  if (!statusData) return null;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-blue-600" />
        Order Status
      </h3>
      <div className="space-y-3">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Order ID</p>
          <p className="font-semibold text-gray-900">
            {statusData.orderNumber || statusData.orderId}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Current Status</p>
          <p className="font-semibold text-green-900 text-lg">
            {statusData.status}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Stage</p>
          <p className="font-semibold text-gray-900">
            Stage {statusData.currentStage + 1} of 5
          </p>
        </div>
      </div>
    </div>
  );
}

function LocationTrackingView({ data }) {
  const locationData = data?.data || data;
  const mapRef = React.useRef(null);

  if (!locationData || !locationData.deliveryPerson) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No location data available</p>
      </div>
    );
  }

  const deliveryLat = locationData.deliveryPerson?.lat;
  const deliveryLng = locationData.deliveryPerson?.lng;
  const destinationLat = locationData.destination?.lat;
  const destinationLng = locationData.destination?.lng;
  const restaurantLat = locationData.restaurant?.lat;
  const restaurantLng = locationData.restaurant?.lng;

  // Calculate map center
  const mapCenter =
    deliveryLat && deliveryLng
      ? [deliveryLat, deliveryLng]
      : restaurantLat && restaurantLng
      ? [restaurantLat, restaurantLng]
      : [27.71, 85.33];

  // Build route coordinates if available
  const routeCoordinates = locationData.roadRoute || [];

  // Determine if driver is on the way (has valid coordinates)
  const isOnTheWay =
    deliveryLat && deliveryLng && deliveryLat !== 0 && deliveryLng !== 0;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-green-600" />
        Location Tracking
      </h3>

      {/* Map */}
      {(isOnTheWay || restaurantLat) && (
        <div className="mb-4">
          <div className="h-64 w-full rounded-lg border border-gray-200 overflow-hidden relative">
            <MapContainer
              ref={mapRef}
              key={`location-map-${deliveryLat}-${deliveryLng}`}
              center={mapCenter}
              zoom={isOnTheWay ? 15 : 13}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Map updater */}
              {isOnTheWay && (
                <MapUpdater
                  location={{ lat: deliveryLat, lng: deliveryLng }}
                  center={restaurantLat ? [restaurantLat, restaurantLng] : null}
                />
              )}

              {/* Route polyline */}
              {routeCoordinates.length > 0 && (
                <Polyline
                  positions={routeCoordinates}
                  pathOptions={{
                    color: "#3B82F6",
                    weight: 5,
                    opacity: 0.8,
                  }}
                />
              )}

              {/* Restaurant marker */}
              {restaurantLat && restaurantLng && (
                <Marker position={[restaurantLat, restaurantLng]}>
                  <Popup>🏪 Restaurant</Popup>
                </Marker>
              )}

              {/* Delivery person marker */}
              {isOnTheWay && (
                <Marker
                  key={`delivery-${deliveryLat}-${deliveryLng}`}
                  position={[deliveryLat, deliveryLng]}
                  icon={deliveryIcon}
                >
                  <Popup>
                    🚴 Delivery Person
                    {locationData.deliveryPerson?.lastUpdated && (
                      <div className="text-xs mt-1">
                        Updated:{" "}
                        {new Date(
                          locationData.deliveryPerson.lastUpdated
                        ).toLocaleTimeString()}
                      </div>
                    )}
                  </Popup>
                </Marker>
              )}

              {/* Destination marker */}
              {destinationLat && destinationLng && (
                <Marker
                  position={[destinationLat, destinationLng]}
                  icon={destinationIcon}
                >
                  <Popup>📍 Your Location</Popup>
                </Marker>
              )}
            </MapContainer>
            {isOnTheWay && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg z-10">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location details */}
      <div className="space-y-3">
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-600 mb-1">Delivery Person Location</p>
          {isOnTheWay ? (
            <>
              <p className="font-mono text-sm">
                Lat: {deliveryLat.toFixed(4)}, Lng: {deliveryLng.toFixed(4)}
              </p>
              {locationData.deliveryPerson?.lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Updated:{" "}
                  {new Date(
                    locationData.deliveryPerson.lastUpdated
                  ).toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">Not yet available</p>
          )}
        </div>
        {destinationLat && destinationLng && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-1">Destination</p>
            <p className="font-mono text-sm">
              Lat: {destinationLat.toFixed(4)}, Lng: {destinationLng.toFixed(4)}
            </p>
          </div>
        )}
        {restaurantLat && restaurantLng && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Restaurant Location</p>
            <p className="font-mono text-sm">
              Lat: {restaurantLat.toFixed(4)}, Lng: {restaurantLng.toFixed(4)}
            </p>
          </div>
        )}
        {locationData.distance && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-1">
              Distance to Destination
            </p>
            <p className="font-semibold text-lg text-green-700">
              {locationData.distance.toFixed(2)} km
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ETAView({ data }) {
  const etaData = data?.data || data;
  if (!etaData) return null;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-600" />
        Estimated Time of Arrival
      </h3>
      <div className="space-y-3">
        <div className="p-6 bg-purple-50 rounded-lg text-center border-2 border-purple-300">
          <p className="text-4xl font-bold text-purple-900 mb-2">
            {etaData.eta}
          </p>
          <p className="text-lg text-purple-700">minutes</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Elapsed Time</p>
            <p className="font-semibold">{etaData.elapsedMinutes} minutes</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Estimated Delivery</p>
            <p className="font-semibold text-sm">
              {new Date(etaData.estimatedDeliveryTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetailsView({ data }) {
  const detailsData = data?.data || data;
  if (!detailsData) return null;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-indigo-600" />
        Order Details
      </h3>
      <div className="space-y-4">
        {/* Items */}
        {detailsData.items && detailsData.items.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Items</h4>
            <div className="space-y-2">
              {detailsData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm py-2 border-b border-gray-100"
                >
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">Rs. {item.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>Rs. {detailsData.subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery Fee</span>
            <span>Rs. {detailsData.deliveryFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>Rs. {detailsData.tax}</span>
          </div>
          {detailsData.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-Rs. {detailsData.discount}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-2 border-t border-gray-300">
            <span>Total</span>
            <span className="text-yellow-600">Rs. {detailsData.total}</span>
          </div>
        </div>

        {/* Customer & Restaurant */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Customer</p>
            <p className="font-semibold text-sm">
              {detailsData.customer?.name}
            </p>
            <p className="text-xs text-gray-600">
              {detailsData.customer?.phone}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Restaurant</p>
            <p className="font-semibold text-sm">
              {detailsData.restaurant?.name}
            </p>
            <p className="text-xs text-gray-600">
              {detailsData.restaurant?.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverInfoView({ data }) {
  const driverData = data?.data || data;
  if (!driverData || !driverData.driver) {
    return (
      <div className="text-center py-8 text-gray-500">
        <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-semibold mb-1">Driver not assigned yet</p>
        <p className="text-xs">
          Driver will be assigned when order is ready for pickup
        </p>
      </div>
    );
  }

  const driver = driverData.driver;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-orange-600" />
        Driver Information
      </h3>
      <div className="space-y-3">
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600 mb-1">Name</p>
          <p className="font-semibold text-lg">{driver.name}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Phone</p>
          <a
            href={`tel:${driver.phone}`}
            className="font-semibold text-lg text-blue-600 hover:underline"
          >
            {driver.phone}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Vehicle Type</p>
            <p className="font-semibold">
              {driver.vehicle?.type || driver.vehicle}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Vehicle Number</p>
            <p className="font-semibold">{driver.vehicle?.number}</p>
          </div>
        </div>
        {driver.rating && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Rating</p>
            <p className="font-semibold">⭐ {driver.rating}/5.0</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressTrackingView({ data }) {
  const progressData = data?.data || data;
  if (!progressData || !progressData.progress) return null;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-pink-600" />
        Progress Tracking
      </h3>
      <div className="space-y-2">
        {progressData.progress.steps.map((step, index) => {
          const isCompleted = step.completed;
          const isCurrent = index === progressData.currentStage;
          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                isCurrent
                  ? "bg-yellow-100 border-2 border-yellow-300"
                  : isCompleted
                  ? "bg-green-50"
                  : "bg-gray-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
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
                {step.timestamp && (
                  <span className="text-xs opacity-75">
                    {new Date(step.timestamp).toLocaleTimeString([], {
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
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">Elapsed Time</p>
        <p className="font-semibold">{progressData.elapsedMinutes} minutes</p>
      </div>
    </div>
  );
}

function RouteInfoView({ data }) {
  const routeData = data?.data || data;
  if (!routeData || !routeData.route) return null;

  const route = routeData.route;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Route className="w-5 h-5 text-teal-600" />
        Route Information
      </h3>
      <div className="space-y-3">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Origin</p>
          <p className="font-semibold">{route.origin?.name || "Restaurant"}</p>
          <p className="text-xs text-gray-500 mt-1">
            {route.origin?.lat.toFixed(4)}, {route.origin?.lng.toFixed(4)}
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Destination</p>
          <p className="text-xs text-gray-500">
            {route.destination?.lat.toFixed(4)},{" "}
            {route.destination?.lng.toFixed(4)}
          </p>
        </div>
        {route.estimatedDistance && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Distance</p>
              <p className="font-semibold">{route.estimatedDistance} km</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Duration</p>
              <p className="font-semibold">{route.estimatedDuration} min</p>
            </div>
          </div>
        )}
        {route.roadRoute && route.roadRoute.length > 0 && (
          <div className="p-3 bg-teal-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Route Points</p>
            <p className="font-semibold text-sm">
              {route.roadRoute.length} coordinates
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
