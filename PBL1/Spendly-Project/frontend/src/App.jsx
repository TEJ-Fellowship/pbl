import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TransactionList from "./features/expenses/TransactionList";
import Navbar from "./components/Navbar/Navbar";

import "./App.css";

function App() {
  return (
    <>
      <Router>
        <div className="appContainer">
          <Navbar />
          <Routes>
            <Route path="/expenses" element={<TransactionList />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
