import React from "react";
import { Routes, Route } from "react-router-dom";
import Hero from "../components/Hero";
import LandingNavbar from "../components/LandingNavbar";
import Footer from "../components/Footer";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
function LandingPage({ showLanding, setShowLanding }) {
  return (
    <>
      <LandingNavbar />
      <Hero setShowLanding={setShowLanding} showLanding={showLanding} />
      <Footer />
    </>
  );
}

export default LandingPage;
