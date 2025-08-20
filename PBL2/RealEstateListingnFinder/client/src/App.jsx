import "./App.css";

import ManageProperty from "./pages/ManageProperty";
import Navbar from "./components/Navbar/Navbar";
import SearchPage from "./pages/Search/SearchPage";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/manage-property" element={<ManageProperty />} />
          <Route path="/explore" element={<SearchPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
