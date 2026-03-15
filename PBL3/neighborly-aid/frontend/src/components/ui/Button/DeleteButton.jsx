import React from "react";
import { Trash2 } from "lucide-react";

const DeleteButton = ({ 
  onClick, 
  isVisible = true, 
  taskStatus = "open",
  className = "",
  size = "default",
  showTooltip = true,
  tooltipText,
  position = "top-right", // top-right, top-left, bottom-right, bottom-left
  disabled = false
}) => {
  if (!isVisible) return null;

  const getButtonSize = () => {
    switch (size) {
      case "small":
        return "p-1.5";
      case "large":
        return "p-3";
      default:
        return "p-2";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return "w-3 h-3";
      case "large":
        return "w-5 h-5";
      default:
        return "w-4 h-4";
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-3 left-3";
      case "bottom-right":
        return "bottom-3 right-3";
      case "bottom-left":
        return "bottom-3 left-3";
      default:
        return "top-3 right-3";
    }
  };

  const getDefaultTooltipText = () => {
    return taskStatus === "in_progress" ? "Cancel Task" : "Delete Task";
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group ${getButtonSize()} ${className}`}
      title={tooltipText || getDefaultTooltipText()}
    >
      <Trash2 className={getIconSize()} />
      {showTooltip && (
        <span className={`absolute ${getPositionClasses()} transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20`}>
          {tooltipText || getDefaultTooltipText()}
        </span>
      )}
    </button>
  );
};

export default DeleteButton;