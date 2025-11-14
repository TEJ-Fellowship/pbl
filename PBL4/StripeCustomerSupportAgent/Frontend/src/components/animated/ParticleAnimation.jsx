import React, { useEffect, useRef } from "react";

const ParticleAnimation = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numStars = 350; // Reduced for better performance
    const garlandPaths = 10; // Number of garland paths
    const starsPerPath = Math.floor(numStars / garlandPaths);

    // Clear any existing stars
    container.innerHTML = "";

    // Create multiple garland paths
    for (let path = 0; path < garlandPaths; path++) {
      const pathContainer = document.createElement("div");
      pathContainer.className = "garland-path";
      pathContainer.style.animationDelay = `${path * 1}s`;
      pathContainer.style.animationDuration = `${25 + Math.random() * 10}s`;

      for (let i = 0; i < starsPerPath; i++) {
        const star = document.createElement("div");
        star.className = "garland-star";

        // Vary star sizes
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;

        // Position stars along a curved garland path
        const progress = i / (starsPerPath - 1);
        const baseAngle = (path / garlandPaths) * Math.PI * 2;
        const waveOffset = Math.sin(progress * Math.PI * 4) * 15; // Wave effect
        const jumbleOffset = (Math.random() - 0.5) * 20; // Random jumbling

        const angle = baseAngle + progress * Math.PI * 2 + waveOffset * 0.1;
        const radius = 40 + waveOffset + jumbleOffset;

        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        star.style.top = `${y}%`;
        star.style.left = `${x}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.animationDuration = `${4 + Math.random() * 4}s`;

        pathContainer.appendChild(star);
      }

      container.appendChild(pathContainer);
    }

    // Cleanup to prevent duplicates on re-render
    return () => {
      container.innerHTML = "";
    };
  }, []);

  return <div ref={containerRef} className="garland-animation" />;
};

export default ParticleAnimation;
