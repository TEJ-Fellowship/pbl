import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import TransactionList from "./features/Transaction/TransactionList";
import Sidebar from "./components/Sidebar/Sidebar";
import Expense from "./components/Expense/Expense";
import "./App.css";
import { useState, useEffect } from "react";

function App() {
  // Initialize from localStorage or use empty array
  const [searchQuery, setSearchQuery] = useState('')
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const deleteTransaction = (id) => {
    const updatedExpenses = expenses.filter(exp => exp.id !== id);
    setExpenses(updatedExpenses);
  };


  const updateTransaction = (updatedExpense) => {
    const updated = expenses.map(exp =>
      exp.id === updatedExpense.id ? updatedExpense : exp
    );
    setExpenses(updated);
  };

  const addExpense = (expense) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);
  };

  return (
    <Router>
      <div className="appContainer">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
        <Sidebar />

        <Routes>
          <Route
            path="/transaction"
            element={
              <TransactionList
                expenses={expenses}
                onDelete={deleteTransaction}
                searchQuery={searchQuery}
              />
            }
          />
          <Route
            path="/edit/:id"
            element={
              <Expense
                onUpdate={updateTransaction}
                expenses={expenses}
              />
            }
          />
          <Route
            path="/add-expense"
            element={<Expense onAddExpense={addExpense} />}
          />
        </Routes>
      </div>
    </Router>

  );
}

export default App;
