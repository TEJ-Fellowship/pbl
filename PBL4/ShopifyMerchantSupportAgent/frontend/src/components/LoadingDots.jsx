import React from "react";

const LoadingDots = () => {
  return (
    <div className="loading-dots">
      <div className="loading-dot" style={{ animationDelay: "0ms" }}></div>
      <div className="loading-dot" style={{ animationDelay: "150ms" }}></div>
      <div className="loading-dot" style={{ animationDelay: "300ms" }}></div>
    </div>
  );
};

export default LoadingDots;
