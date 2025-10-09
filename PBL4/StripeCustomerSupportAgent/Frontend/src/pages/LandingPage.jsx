import React from "react";
import Header from "../components/Header";
import ParticleAnimation from "../components/ParticleAnimation";
import HeroSection from "../components/HeroSection";

const LandingPage = () => {
  return (
    <div className="bg-background-dark text-text-dark font-display h-screen overflow-hidden flex">
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <Header />

        {/* Main Content with Animation */}
        <div className="flex-1 flex items-center justify-end relative">
          <ParticleAnimation />
          <HeroSection />
        </div>

        {/* Corner Elements */}
        <div className="absolute bottom-6 left-6 z-10">
          <div
            className="vertical-text text-7xl font-thin tracking-tighter text-text-dark"
            style={{ height: "15rem" }}
          >
            Stripe.AI
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-10">
          <p className="font-light text-xs text-subtle-dark max-w-xs text-right">
            API Integration & Billing Assistant. Trained on official
            documentation for accurate, context-aware responses.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
