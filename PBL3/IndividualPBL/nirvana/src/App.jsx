import React,{useState} from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Homepage from "./pages/Homepage";
import { useContext } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Layout from "./Layout";
import { AuthContext } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import { ActionCodeOperation } from "firebase/auth";

function App() {
  const [streak, setStreak] = useState(0);
  const {isLoggedIn}=useContext(AuthContext)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout streak={streak} />}>
          <Route index element={isLoggedIn ?<Dashboard streak={streak} setStreak={setStreak}/>:<Homepage />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="dashboard" element={<ProtectedRoute isloggedIn={isLoggedIn} >
             <Dashboard streak={streak} setStreak={setStreak}/>
          </ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
