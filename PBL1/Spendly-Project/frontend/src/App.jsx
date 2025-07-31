import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Expense from "./components/Add-Expense/Expense"

import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";

function App() {
  return (
    <>
      <Router>
        <div className="appContainer">
          <Navbar />

          <Sidebar />

          <Expense />
        </div>
      </Router>
    </>
  );
}

export default App;
