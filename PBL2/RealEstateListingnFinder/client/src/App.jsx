import "./App.css";
import ManageProperty from "./pages/ManageProperty";
import Navbar from "./components/Navbar/Navbar";
import SearchPage from "./pages/Search/SearchPage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Landing from "./components/front/landing";
import UserDashboard from "./components/UserDashboard/UserDashboard";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProtectedRoute from "./components/ProtectedRoute";
import RestrictedAccess from "./components/RestrictedAccess";
import { AuthProvider } from "./contexts/AuthContext";

function AppContent() {
  const location = useLocation();
  return (
    <>
      {location.pathname !== "/auth" && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<Auth />} />

        {/* Protected Routes */}
        <Route
          path="/manage-property"
          element={
            <ProtectedRoute>
              <ManageProperty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/UserDashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback route for unauthorized access attempts */}
        <Route path="/restricted" element={<RestrictedAccess />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;
