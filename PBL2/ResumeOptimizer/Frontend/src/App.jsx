import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import MyResume from "./Pages/MyResume.jsx";
import Preview from "./Pages/Preview.jsx";
import LandingPage from "./Pages/LandingPage.jsx";
import LoginSignup from "./components/LoginSignup/LoginSignup.jsx";
import JobMatch from "./Pages/JobMatch.jsx";

// --- Protected Route Wrapper ---
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("jwtToken");
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/resume" element={<PrivateRoute><MyResume /></PrivateRoute>} />
      <Route path="/preview/:id" element={<PrivateRoute><Preview /></PrivateRoute>} />
      <Route path="/match/:id" element={<PrivateRoute><JobMatch /></PrivateRoute>} />

      <Route path="/login" element={<LoginSignup />} />
      <Route path="/signup" element={<LoginSignup />} />
    </Routes>
  );
}
