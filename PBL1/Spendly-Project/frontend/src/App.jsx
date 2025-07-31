import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";

import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";

function App() {
  return (
    <>
      <Router>
        <div className="appContainer">
          <Navbar />
          <Sidebar />
        </div>
      </Router>
    </>
  );
}

export default App;
