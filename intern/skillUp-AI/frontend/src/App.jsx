import "./index.css";
import LoginForm from "./components/Auth/LoginForm";
import RegistrForm from "./components/Auth/RegisterForm";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

function App() {

  const isAuthenticated = localStorage.getItem("tokan");
  return (
    <Router>
      <Routes>
       <Route path="/login" element={isAuthenticated ? <Navigate to="/"/> : <LoginForm />} />
       <Route path="/register" element={isAuthenticated ? <Navigate to="/"/> : <RegistrForm />} />
       <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login"/>} />
      </Routes>
    </Router>
  );
}

export default App;
