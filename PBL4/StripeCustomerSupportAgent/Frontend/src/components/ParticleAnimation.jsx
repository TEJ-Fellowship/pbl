import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// const ParticleAnimation = () => {
//   const containerRef = useRef(null);

//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) return;

//     const numStars = 600;

//     // Clear any existing stars
//     container.innerHTML = "";

//     for (let i = 0; i < numStars; i++) {
//       const star = document.createElement("div");
//       star.className = "star";
//       const size = Math.random() * 2.5 + 0.5;
//       star.style.width = `${size}px`;
//       star.style.height = `${size}px`;

//       const angle = Math.random() * 2 * Math.PI;
//       const radius = Math.sqrt(Math.random()) * 50;
//       const x = 50 + radius * Math.cos(angle);
//       const y = 50 + radius * Math.sin(angle);

//       star.style.top = `${y}%`;
//       star.style.left = `${x}%`;
//       star.style.animationDelay = `${Math.random() * 3}s`;
//       star.style.animationDuration = `${Math.random() * 2 + 1.5}s`;

//       container.appendChild(star);
//     }

//     // Cleanup to prevent duplicates on re-render
//     return () => {
//       container.innerHTML = "";
//     };
//   }, []);

//   return <div ref={containerRef} className="particle-animation" />;
// };

const ParticleAnimation = () => {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      // Dynamic import to avoid build issues
      import("vanta/dist/vanta.globe.min").then((VANTA) => {
        setVantaEffect(
          VANTA.default({
            el: vantaRef.current,
            THREE,
            mouseControls: true,
            touchControls: true,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0xb71ea0,
            backgroundColor: 0x000000,
            size: 1.0,
            spacing: 15.0,
            // Add these for better centering
            gyroControls: false,
            focus: 0.0, // Adjust focus point
            rotation: 0.0,
          })
        );
      });
    }

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <div
      ref={vantaRef}
      className="w-full h-screen"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1,
        transform: "scaleX(-1)",
        pointerEvents: "none", // Allow clicks to pass through
      }}
    />
  );
};

export default ParticleAnimation;
