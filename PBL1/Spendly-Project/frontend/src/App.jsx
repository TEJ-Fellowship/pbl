import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import ExpenseForm from "./components/Add-Expense/Expense";
import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import './components/Add-Expense/Expense.css'

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
