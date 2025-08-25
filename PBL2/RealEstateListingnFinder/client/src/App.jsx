import "./App.css";
import ManageProperty from "./pages/ManageProperty";
import Navbar from "./components/Navbar/Navbar";
import SearchPage from "./pages/Search/SearchPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./components/front/landing";
import UserDashboard from "./components/UserDashboard/UserDashboard";

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/manage-property" element={<ManageProperty />} />
          <Route path="/explore" element={<SearchPage />} />
          <Route path="/UserDashboard" element={<UserDashboard />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
