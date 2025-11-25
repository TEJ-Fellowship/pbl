import React from "react";
import ParticleAnimation from "../components/animated/ParticleAnimation";
import HeroSection from "../components/landingPage/HeroSection";
import Header from "../components/landingPage/Header";

const LandingPage = () => {
  return (
    <div className="h-screen overflow-hidden flex">
      {/* Header */}
      <div className="fixed top-0 right-0 p-6 z-40">
        <Header />
      </div>

      {/* Description at Bottom Right */}
      <div className="fixed bottom-6 right-6 z-30">
        <p className="font-light text-xs text-subtle-dark max-w-xs text-right">
          API Integration & Billing Assistant. Trained on official documentation
          for accurate, context-aware responses.
        </p>
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Main Content with Animation */}
        <div className="flex-1 flex items-center justify-end relative">
          <ParticleAnimation />
          <HeroSection />
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
