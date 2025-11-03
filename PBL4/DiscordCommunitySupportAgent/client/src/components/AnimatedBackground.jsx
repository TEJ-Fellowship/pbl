import { useEffect } from "react";

const AnimatedBackground = () => {
  useEffect(() => {
    const container = document.getElementById("stars");
    if (!container) return;

    // Clear if re-mounted
    container.innerHTML = "";

    // Falling stars (small, continuous) - make them brighter
    for (let i = 0; i < 100; i++) {
      const star = document.createElement("div");
      star.className = "star falling";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${-100 - Math.random() * 50}px`; // Start further up
      star.style.animationDuration = `${4 + Math.random() * 6}s`; // Faster fall
      star.style.animationDelay = `${Math.random() * 8}s`;
      star.style.opacity = `${0.8 + Math.random() * 0.2}`; // Brighter
      container.appendChild(star);
    }

    // Stationary glowing stars (larger, bright) - make them more visible
    for (let i = 0; i < 50; i++) {
      const s = document.createElement("div");
      s.className = "star large";
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 2}s`;
      s.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
      const size = 4 + Math.floor(Math.random() * 4); // 4–7px - bigger
      s.style.width = `${size}px`;
      s.style.height = `${size}px`;
      s.style.opacity = `${0.9 + Math.random() * 0.1}`; // Very bright
      s.style.filter = "drop-shadow(0 0 15px rgba(88,101,242,1)) drop-shadow(0 0 25px rgba(88,101,242,0.7))";
      container.appendChild(s);
    }
    
    // Add some additional static small stars for depth
    for (let i = 0; i < 150; i++) {
      const staticStar = document.createElement("div");
      staticStar.className = "star";
      staticStar.style.left = `${Math.random() * 100}%`;
      staticStar.style.top = `${Math.random() * 100}%`;
      staticStar.style.opacity = `${0.3 + Math.random() * 0.4}`;
      staticStar.style.width = `${1 + Math.random()}px`;
      staticStar.style.height = staticStar.style.width;
      container.appendChild(staticStar);
    }
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Stars container - must be first to be behind orbs but visible */}
      <div id="stars" className="absolute inset-0 z-[1]"></div>

      {/* Gradient orbs - behind stars container for proper layering */}
      <div className="gradient-orb orb1 z-0"></div>
      <div className="gradient-orb orb2 z-0"></div>
      <div className="gradient-orb orb3 z-0"></div>
    </div>
  );
};

export default AnimatedBackground;


