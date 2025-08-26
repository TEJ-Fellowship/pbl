import "./App.css";
import ManageProperty from "./pages/ManageProperty";
import Navbar from "./components/Navbar/Navbar";
import SearchPage from "./pages/Search/SearchPage";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Landing from "./components/front/landing";
import UserDashboard from "./components/UserDashboard/UserDashboard";
import Auth from "./pages/Auth";

function AppContent() {
  const location = useLocation();
  return (
    <>
      {location.pathname !== "/auth" && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/manage-property" element={<ManageProperty />} />
        <Route path="/explore" element={<SearchPage />} />
        <Route path="/UserDashboard" element={<UserDashboard />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <>
      <Router>
        <AppContent />
      </Router>
    </>
  );
}

export default App;
