import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";


import TransactionList from "./features/Transaction/TransactionList";

import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import ExpenseForm from "./components/Expense/Expense";
import { useState } from "react";


function App() {
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <>
      <Router>
        <div className="appContainer">
          <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
          <Sidebar />

          <Routes>
            <Route path="/transaction" element={<TransactionList searchQuery={searchQuery} />}></Route>
            <Route path="/add-expense" element={<ExpenseForm />}></Route>
          </Routes>

        </div>
      </Router>
    </>
  );
}

export default App;
