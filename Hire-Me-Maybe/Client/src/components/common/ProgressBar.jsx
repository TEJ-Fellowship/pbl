import React from "react";

const ProgressBar = ({ progress, status = "Processing..." }) => {
  return (
    <div>
      <div>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: "#4CAF50",
            transition: "width 0.3s ease",
          }}
        ></div>
      </div>
      <div>
        {status} - {progress}%
      </div>
    </div>
  );
};

export default ProgressBar;
