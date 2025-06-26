// frontend/src/components/GeminiIcon.jsx
import React, { useState, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";

const GeminiIcon = ({
  onClick,
  disabled = false,
  loading = false,
  size = "md", // sm, md, lg
  tooltip = "Try Gemini",
  tooltipDescription = "AI-powered suggestions",
  className = "",
  showTooltip = true,
  variant = "gradient", // gradient, solid, outline
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const buttonRef = useRef(null);

  // Size configurations
  const sizeConfig = {
    sm: {
      button: "p-2",
      icon: "w-4 h-4",
      tooltip: "text-xs px-3 py-2",
      tooltipIcon: "w-3 h-3"
    },
    md: {
      button: "p-2.5",
      icon: "w-5 h-5",
      tooltip: "text-sm px-4 py-2.5",
      tooltipIcon: "w-3.5 h-3.5"
    },
    lg: {
      button: "p-3",
      icon: "w-6 h-6",
      tooltip: "text-base px-5 py-3",
      tooltipIcon: "w-4 h-4"
    }
  };

  // Variant configurations
  const variantConfig = {
    gradient: {
      base: "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500",
      hover: "hover:from-blue-600 hover:via-purple-600 hover:to-pink-600",
      disabled: "disabled:from-gray-400 disabled:to-gray-500",
      shadow: "shadow-lg hover:shadow-xl hover:shadow-purple-500/25",
      shimmer: "from-transparent via-white/30 to-transparent",
      pulse: "from-blue-400 to-purple-400"
    },
    solid: {
      base: "bg-purple-600",
      hover: "hover:bg-purple-700",
      disabled: "disabled:bg-gray-400",
      shadow: "shadow-lg hover:shadow-xl hover:shadow-purple-500/25",
      shimmer: "from-transparent via-white/20 to-transparent",
      pulse: "from-purple-400 to-purple-500"
    },
    outline: {
      base: "border-2 border-purple-500 bg-transparent",
      hover: "hover:bg-purple-50 hover:border-purple-600 dark:hover:bg-purple-900/20",
      disabled: "disabled:border-gray-400 disabled:text-gray-400",
      shadow: "shadow-sm hover:shadow-md",
      shimmer: "from-transparent via-purple-200/30 to-transparent",
      pulse: "from-purple-300 to-purple-400"
    }
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  const handleMouseEnter = () => {
    if (showTooltip) setShowTooltipState(true);
  };

  const handleMouseLeave = () => {
    if (showTooltip) setShowTooltipState(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled || loading}
        className={`
          group relative overflow-hidden rounded-full transition-all duration-500 ease-out
          ${currentSize.button}
          ${currentVariant.base}
          ${currentVariant.hover}
          ${currentVariant.disabled}
          ${currentVariant.shadow}
          disabled:cursor-not-allowed
          transform hover:scale-105 active:scale-95
          before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
          ${className}
        `}
      >
        {/* Shimmer effect */}
        <div className={`
          absolute inset-0 -translate-x-full group-hover:translate-x-full 
          transition-transform duration-1000 ease-out 
          bg-gradient-to-r ${currentVariant.shimmer}
        `}></div>
        
        {/* Icon container with smooth transitions */}
        <div className="relative z-10 transition-all duration-300 ease-out group-hover:rotate-12">
          {loading ? (
            <Loader2 className={`${currentSize.icon} ${variant === 'outline' ? 'text-purple-600' : 'text-white'} animate-spin`} />
          ) : (
            <Sparkles className={`
              ${currentSize.icon} 
              ${variant === 'outline' ? 'text-purple-600 group-hover:text-purple-700' : 'text-white'} 
              transition-all duration-300 ease-out group-hover:scale-110 drop-shadow-sm
            `} />
          )}
        </div>
        
        {/* Pulse ring effect on hover */}
        <div className={`
          absolute inset-0 rounded-full bg-gradient-to-br ${currentVariant.pulse}
          opacity-0 group-hover:opacity-20 scale-100 group-hover:scale-150 
          transition-all duration-500 ease-out
        `}></div>
      </button>
      
      {/* Enhanced Tooltip with smooth animations */}
      {showTooltip && (
        <div className={`
          absolute right-0 top-full mt-2 transition-all duration-300 ease-out z-50
          ${showTooltipState 
            ? 'opacity-100 translate-y-0 visible' 
            : 'opacity-0 -translate-y-2 invisible'
          }
        `}>
          <div className={`
            bg-gray-900/95 backdrop-blur-sm text-white rounded-xl shadow-2xl 
            border border-white/10 whitespace-nowrap ${currentSize.tooltip}
          `}>
            <div className="flex items-center gap-2">
              <Sparkles className={`${currentSize.tooltipIcon} text-purple-300`} />
              <span className="font-medium">{tooltip}</span>
            </div>
            {tooltipDescription && (
              <div className="text-xs text-gray-300 mt-0.5">
                {tooltipDescription}
              </div>
            )}
            {/* Arrow */}
            <div className="absolute -top-2 right-6 w-4 h-4 bg-gray-900/95 rotate-45 border-l border-t border-white/10"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiIcon;