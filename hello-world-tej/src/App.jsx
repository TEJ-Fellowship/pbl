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

          <h1 className="hero-title">Hello World from TEJ!!</h1>
          <p className="hero-subtitle">Welcome to PBL Monorepo.🚀</p>
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
