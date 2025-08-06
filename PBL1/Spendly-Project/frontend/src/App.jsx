import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";


import TransactionList from "./features/Transaction/TransactionList";

import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import ExpenseForm from "./components/Expense/Expense";
import { useState } from "react";
import Dashboard from "./pages/dashboard";


function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [barActive, setBarActive] = useState(false);
  return (
    <>
      <Router>
        <div className="appContainer">
          <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
          <Sidebar barActive={barActive} setBarActive={setBarActive}/>

          <Routes>
            <Route path="/transaction" element={<TransactionList searchQuery={searchQuery} />}></Route>
            <Route path="/add-expense" element={<ExpenseForm />}></Route>
            <Route path="/" element={<Dashboard barActive={barActive} />}></Route>
          </Routes>

        </div>
      </Router>
    </>
  );
}

export default App;
