import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";

import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import TransactionList from "./features/Transaction/TransactionList";

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
