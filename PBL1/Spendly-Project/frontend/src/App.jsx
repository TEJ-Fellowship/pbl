import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";


import TransactionList from "./features/Transaction/TransactionList";

import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import ExpenseForm from "./components/Expense/Expense";


function App() {
  return (
    <>
      <Router>
        <div className="appContainer">
          <Navbar />
          <Sidebar />

          <Routes>
            <Route path="/transaction" element={<TransactionList />}></Route>
            <Route path="/add-expense" element={<ExpenseForm />}></Route>
          </Routes>

        </div>
      </Router>
    </>
  );
}

export default App;
