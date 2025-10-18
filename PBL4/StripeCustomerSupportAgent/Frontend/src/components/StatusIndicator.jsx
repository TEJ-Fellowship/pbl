import React, { useState, useEffect } from "react";
import { apiService } from "../services/api.js";

const StatusIndicator = () => {
  const [status, setStatus] = useState("checking");
  const [lastChecked, setLastChecked] = useState(null);

  const checkStatus = async () => {
    try {
      const response = await apiService.getHealth();
      setStatus("online");
      setLastChecked(new Date());
    } catch (error) {
      setStatus("offline");
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "text-green-400";
      case "offline":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "online":
        return "Connected";
      case "offline":
        return "Disconnected";
      default:
        return "Checking...";
    }
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div
        className={`w-2 h-2 rounded-full ${
          status === "online"
            ? "bg-green-400"
            : status === "offline"
            ? "bg-red-400"
            : "bg-yellow-400"
        }`}
      ></div>
      <span className={getStatusColor()}>{getStatusText()}</span>
      {lastChecked && (
        <span className="text-gray-500">
          ({lastChecked.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
