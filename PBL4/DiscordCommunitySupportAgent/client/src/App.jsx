import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import TrendingTopics from "./components/TrendingTopics.jsx";
import KeyBenefits from "./components/KeyBenefits.jsx";
import CTA from "./components/CTA.jsx";
import Footer from "./components/Footer.jsx";
import ChatInterface from "./components/ChatInterface.jsx";
import AnimatedBackground from "./components/AnimatedBackground.jsx";
import HistorySidebar from "./components/HistorySidebar.jsx";
import { useState } from "react";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState('default');

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  // Fullscreen chat (launcher)
  if (showChat) {
    return <ChatInterface sessionId={activeSessionId} onClose={() => setShowChat(false)} />;
  }

  // Show original landing page if not authenticated
  return (
    <>
      <div className="relative bg-black text-gray-100 min-h-screen font-sans">
        <AnimatedBackground />
        <Navbar onLogin={handleLogin} onOpenChat={() => { setActiveSessionId('default'); setShowChat(true); }} onOpenHistory={() => setShowHistorySidebar(true)} />
        <Hero />
        <TrendingTopics />
        <KeyBenefits />
        <CTA />
        <Footer />
        <HistorySidebar
          open={showHistorySidebar}
          onClose={() => setShowHistorySidebar(false)}
          onSelect={(id) => { setActiveSessionId(id); setShowHistorySidebar(false); setShowChat(true); }}
        />
      </div>
    </>
  );
}

export default App;
