import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Expense from "./components/Add-Expense/Expense"

import "./App.css";

function App() {
  return (
    <>
      <Router>
        <div className="appContainer">
          <Navbar />
          <Expense />
        </div>
      </Router>
    </>
  );
}

export default App;
