import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";


import TransactionList from "./features/Transaction/TransactionList";

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

          <Routes>
            <Route path="/transaction" element={<TransactionList />}></Route>
          </Routes>
          <TransactionList />

        </div>
      </Router>
    </>
  );
}

export default App;
