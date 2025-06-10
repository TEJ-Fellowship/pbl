import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div className="app">
      <div className="hero-section">
        <div className={`main-content ${animate ? "fade-in" : ""}`}>
          <div className="logo-container">
            <img src="/logo.png" alt="" />
          </div>

          {/* Simple Tailwind Test */}
          <div className="text-red-500 text-4xl font-bold bg-yellow-200 p-6 m-5 border-4 border-red-500">
            TAILWIND TEST - RED text, YELLOW bg, GREEN border
          </div>
          
          {/* Additional Test */}
          <div className="bg-green-500 text-green-100 p-8 text-2xl">
            If you see WHITE text on BUE background, Tailwind is working!
          </div>
          
          <h1 className="text-sm text-amber-800">Hello World from TEJ!!</h1>
          <h2 className="text-amber-700">Weather APP project</h2>
          <p className="hero-subtitle text-amber-600">Welcome to PBL Monorepo.🚀</p>

          {/* Tailwind CSS Test - Remove this after confirming it works */}
          <div className="mt-6 p-4 bg-amber-100 text-amber-900 border-2 border-amber-300 rounded-lg shadow-lg max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-2">
              🎉 Tailwind CSS is working!
            </h3>
            <p className="text-sm">
              This brown box shows Tailwind brown colors are working perfectly!
            </p>
          </div>
          {/* 
          <div className="feature-cards">
            <div className="card">
              <div className="card-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Built with Vite for blazing fast development</p>
            </div>

            <div className="card">
              <div className="card-icon">⚛️</div>
              <h3>React Powered</h3>
              <p>Modern React with hooks and components</p>
            </div>

            <div className="card">
              <div className="card-icon">🎨</div>
              <h3>Beautiful UI</h3>
              <p>Clean, modern design with smooth animations</p>
            </div>
          </div>

          <div className="cta-section">
            <button className="cta-button">
              Get Started
              <span className="button-arrow">→</span>
            </button>
          </div> */}
        </div>

        <div className="floating-elements">
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
        </div>
      </div>
    </div>
  );
}

export default App;
