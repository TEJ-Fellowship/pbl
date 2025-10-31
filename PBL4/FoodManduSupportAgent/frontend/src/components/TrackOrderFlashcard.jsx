/**
 * Track Order Flashcard Component (Refactored)
 * Now shows tool selection menu first, then tool-specific results
 */

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, X } from "lucide-react";
import * as mcpClient from "../services/mcpClient.js";
import ToolSelectionMenu from "./ToolSelectionMenu.jsx";
import ToolResultView from "./ToolResultView.jsx";

export default function TrackOrderFlashcard({
  orderId,
  restaurantLocation,
  onClose,
}) {
  const { t } = useTranslation();
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolData, setToolData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState("prompt");
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const toolDataRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    toolDataRef.current = toolData;
  }, [toolData]);

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
      },
      (error) => {
        console.error("❌ Error getting location:", error);
        setLocationPermission("denied");
        setIsRequestingLocation(false);
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

  // Initial fetch when tool is selected
  useEffect(() => {
    if (!orderId || !selectedTool) return;

    const fetchToolData = async (isUpdate = false) => {
      // Only show loading spinner on initial fetch, not on updates
      if (!isUpdate) {
        setLoading(true);
        setError(null);
      }

      try {
        let result;

        if (selectedTool === "get_all_details") {
          // Get comprehensive tracking data
          const comprehensiveData = await mcpClient.getComprehensiveTracking(
            orderId,
            userLocation?.lat || null,
            userLocation?.lng || null
          );

          // Check if comprehensiveData is successful
          if (!comprehensiveData || !comprehensiveData.success) {
            console.error(
              "❌ Comprehensive tracking failed:",
              comprehensiveData
            );
            throw new Error(
              comprehensiveData?.error ||
                "Failed to fetch comprehensive tracking data"
            );
          }

          // Only fetch order details on initial load, not on updates
          let orderDetails = {};
          if (!isUpdate) {
            try {
              const detailsResponse = await mcpClient.getOrderDetails(orderId);
              if (detailsResponse?.success) {
                orderDetails = detailsResponse.data || detailsResponse;
              }
            } catch (err) {
              console.warn("Could not fetch order details:", err);
            }
          } else {
            // On update, preserve existing order details from current state
            const currentData = toolDataRef.current?.comprehensive;
            if (currentData) {
              orderDetails = {
                items: currentData.items,
                total: currentData.total,
                paymentMethod: currentData.paymentMethod,
                deliveryInstructions: currentData.deliveryInstructions,
                customer: currentData.customer,
                restaurant: { phone: currentData.restaurant?.phone || "" },
              };
            }
          }

          // Extract nested data from tool responses
          const statusData =
            comprehensiveData.status?.data || comprehensiveData.status || {};
          const locationData =
            comprehensiveData.location?.data ||
            comprehensiveData.location ||
            {};
          const etaData =
            comprehensiveData.eta?.data || comprehensiveData.eta || {};
          const progressData =
            comprehensiveData.progress?.data ||
            comprehensiveData.progress ||
            {};
          const routeData =
            comprehensiveData.route?.data || comprehensiveData.route || {};
          const driverData =
            comprehensiveData.driver?.data || comprehensiveData.driver || {};

          // Transform to comprehensive format
          const transformedData = {
            orderId: comprehensiveData.orderId || orderId,
            orderNumber: statusData.orderNumber || orderId,
            restaurantName:
              routeData.route?.origin?.name ||
              routeData.origin?.name ||
              "Restaurant",
            restaurantLocation: restaurantLocation || "Kathmandu",
            eta: etaData.eta || 0,
            status: statusData.status || "Unknown",
            currentStage:
              statusData.currentStage ??
              progressData.currentStage ??
              (statusData.rawStatus === "on_the_way"
                ? 3
                : statusData.rawStatus === "order_ready"
                ? 2
                : statusData.rawStatus === "order_preparing"
                ? 1
                : statusData.rawStatus === "delivered"
                ? 4
                : 0),
            orderPlacedAt: etaData.orderPlacedAt || new Date().toISOString(),
            elapsedMinutes: etaData.elapsedMinutes || 0,
            location: {
              lat:
                locationData.deliveryPerson?.lat ||
                locationData.currentLocation?.latitude ||
                0,
              lng:
                locationData.deliveryPerson?.lng ||
                locationData.currentLocation?.longitude ||
                0,
            },
            destination: {
              lat:
                locationData.destination?.lat ||
                locationData.destination?.latitude ||
                0,
              lng:
                locationData.destination?.lng ||
                locationData.destination?.longitude ||
                0,
            },
            restaurant: {
              lat:
                locationData.restaurant?.lat ||
                locationData.restaurant?.latitude ||
                0,
              lng:
                locationData.restaurant?.lng ||
                locationData.restaurant?.longitude ||
                0,
              name:
                routeData.route?.origin?.name ||
                routeData.origin?.name ||
                "Restaurant",
              phone: orderDetails?.restaurant?.phone || "",
            },
            roadRoute: routeData.route?.roadRoute || routeData.roadRoute || [],
            driver: driverData.driver || driverData || null,
            progress: progressData.progress || {
              steps: progressData.steps || [],
            },
            items: orderDetails?.items || [],
            total: orderDetails?.total || 0,
            paymentMethod: orderDetails?.paymentMethod || "",
            deliveryInstructions: orderDetails?.deliveryInstructions || "",
            customer: orderDetails?.customer || {},
          };

          console.log("✅ Transformed comprehensive data:", transformedData);
          result = { comprehensive: transformedData };
        } else if (selectedTool === "get_location_tracking" && isUpdate) {
          // For location tracking updates, only fetch location data
          result = await mcpClient.getLocationTracking(
            orderId,
            userLocation?.lat || null,
            userLocation?.lng || null
          );
          // Merge with existing data
          const currentToolData = toolDataRef.current;
          if (currentToolData) {
            result = {
              ...currentToolData,
              data: { ...currentToolData.data, ...result.data },
            };
          }
        } else {
          // Fetch individual tool data (only on initial load)
          if (isUpdate && selectedTool !== "get_location_tracking") {
            return; // Don't update other tools
          }

          switch (selectedTool) {
            case "get_order_status":
              result = await mcpClient.getOrderStatus(orderId);
              break;
            case "get_location_tracking":
              result = await mcpClient.getLocationTracking(
                orderId,
                userLocation?.lat || null,
                userLocation?.lng || null
              );
              break;
            case "calculate_eta":
              result = await mcpClient.calculateETA(orderId);
              break;
            case "get_order_details":
              result = await mcpClient.getOrderDetails(orderId);
              break;
            case "get_driver_info":
              result = await mcpClient.getDriverInfo(orderId);
              break;
            case "get_progress_tracking":
              result = await mcpClient.getProgressTracking(orderId);
              break;
            case "get_route_info":
              result = await mcpClient.getRouteInfo(
                orderId,
                userLocation?.lat || null,
                userLocation?.lng || null
              );
              break;
            default:
              throw new Error(`Unknown tool: ${selectedTool}`);
          }
        }

        setToolData(result);
      } catch (err) {
        console.error("Error fetching tool data:", err);
        if (!isUpdate) {
          setError(err.message);
        }
      } finally {
        if (!isUpdate) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchToolData(false);

    // Poll for updates every 5 seconds if it's a tracking tool
    // Only update location/map data, don't re-fetch everything
    let intervalId;
    if (
      selectedTool === "get_all_details" ||
      selectedTool === "get_location_tracking"
    ) {
      intervalId = setInterval(() => {
        // Use functional update to access latest toolData
        fetchToolData(true); // Pass true to indicate it's an update
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [orderId, selectedTool, userLocation, restaurantLocation]);

  // Handle tool selection
  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
    setToolData(null);
    setError(null);
  };

  // Handle back to menu
  const handleBack = () => {
    setSelectedTool(null);
    setToolData(null);
    setError(null);
  };

  // Validate order ID
  if (!orderId || orderId.trim().length < 3) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg mt-4">
        <div className="text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">
            {t("pleaseProvideOrderDetails") ||
              "Please provide a valid Order ID"}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Order ID must be at least 3 characters
          </p>
        </div>
      </div>
    );
  }

  // Show tool selection menu if no tool selected
  if (!selectedTool) {
    return (
      <>
        <ToolSelectionMenu orderId={orderId} onToolSelect={handleToolSelect} />
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </>
    );
  }

  // Show tool result view
  return (
    <>
      <ToolResultView
        selectedTool={selectedTool}
        toolData={toolData}
        orderId={orderId}
        loading={loading}
        error={error}
        onBack={handleBack}
        onClose={onClose}
      />
      {error && !toolData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={handleBack}
            className="mt-2 text-xs text-red-700 hover:text-red-900 underline"
          >
            Try a different option
          </button>
        </div>
      )}
    </>
  );
}
