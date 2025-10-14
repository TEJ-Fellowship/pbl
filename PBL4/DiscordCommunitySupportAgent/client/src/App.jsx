import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import TrendingTopics from "./components/TrendingTopics.jsx";
import KeyBenefits from "./components/KeyBenefits.jsx";
import CTA from "./components/CTA.jsx";
import Footer from "./components/Footer.jsx";
import ChatInterface from "./components/ChatInterface.jsx";
import { useState } from "react";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  // Show chat interface if user is authenticated
  if (isAuthenticated) {
    return <ChatInterface user={user} onLogout={handleLogout} />;
  }

  // Show original landing page if not authenticated
  return (
    <>
      <div className="bg-gray-900 text-gray-100 min-h-screen font-sans">
        <Navbar onLogin={handleLogin} />
        <Hero />
        <TrendingTopics />
        <KeyBenefits />
        <CTA />
        <Footer />
      </div>
    </>
  );
}

export default App;
