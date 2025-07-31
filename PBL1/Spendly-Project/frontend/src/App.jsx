import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";

import "./App.css";

function App() {
  return (
    <>
      <Router>
        <div className="appContainer">
          <Navbar />
        </div>
      </Router>
    </>
  );
}

export default App;
