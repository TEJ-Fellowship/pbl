/**
 * Tool Selection Menu Component
 * Shows available MCP tools for order tracking
 */

import React from "react";
import {
  CheckCircle,
  MapPin,
  Clock,
  Package,
  User,
  Route,
  BarChart3,
  List,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const AVAILABLE_TOOLS = [
  {
    id: "get_all_details",
    name: "Get All Details",
    description:
      "View complete order information with map, ETA, status, and everything",
    icon: List,
    color: "yellow",
  },
  {
    id: "get_order_status",
    name: "Order Status",
    description: "Check the current status of your order",
    icon: CheckCircle,
    color: "blue",
  },
  {
    id: "get_location_tracking",
    name: "Location Tracking",
    description: "Track the delivery person's current location",
    icon: MapPin,
    color: "green",
  },
  {
    id: "calculate_eta",
    name: "Estimated Time of Arrival",
    description: "See when your order will arrive",
    icon: Clock,
    color: "purple",
  },
  {
    id: "get_order_details",
    name: "Order Details",
    description: "View items, pricing, and order information",
    icon: Package,
    color: "indigo",
  },
  {
    id: "get_driver_info",
    name: "Driver Information",
    description: "Get driver contact and vehicle details",
    icon: User,
    color: "orange",
  },
  {
    id: "get_progress_tracking",
    name: "Progress Tracking",
    description: "See order progress stages and timeline",
    icon: BarChart3,
    color: "pink",
  },
  {
    id: "get_route_info",
    name: "Route Information",
    description: "View delivery route and navigation details",
    icon: Route,
    color: "teal",
  },
];

export default function ToolSelectionMenu({ orderId, onToolSelect }) {
  const { t } = useTranslation();

  const colorClasses = {
    yellow:
      "bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700",
    blue: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700",
    green: "bg-green-50 hover:bg-green-100 border-green-200 text-green-700",
    purple:
      "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700",
    indigo:
      "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700",
    orange:
      "bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700",
    pink: "bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700",
    teal: "bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg mt-4">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {t("howWouldYouLikeToGetAssistance") ||
            "How would you like to get assistance with your order?"}
        </h3>
        <p className="text-sm text-gray-600">
          {t("selectAnOptionBelow") ||
            "Select an option below to view specific information about your order"}
        </p>
        {orderId && (
          <div className="mt-3 inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
            Order ID: {orderId}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AVAILABLE_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left group ${
                colorClasses[tool.color]
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg bg-white ${
                    tool.id === "get_all_details"
                      ? "ring-2 ring-yellow-400"
                      : ""
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      tool.id === "get_all_details"
                        ? "text-yellow-600"
                        : `text-${tool.color}-600`
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1 group-hover:underline">
                    {tool.name}
                    {tool.id === "get_all_details" && (
                      <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </h4>
                  <p className="text-xs opacity-75">{tool.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
