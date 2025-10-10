import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import TrendingTopics from "./components/TrendingTopics.jsx";
import KeyBenefits from "./components/KeyBenefits.jsx";
import CTA from "./components/CTA.jsx";
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <>
      <div className="bg-gray-900 text-gray-100 min-h-screen font-sans">
        <Navbar />
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
