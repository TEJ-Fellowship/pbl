import React from 'react';

const LoadingSpinner = ({ size = "default" }) => {
  const sizes = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
    </div>
  );
};

export default LoadingSpinner;