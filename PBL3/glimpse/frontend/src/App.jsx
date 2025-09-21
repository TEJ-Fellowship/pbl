
import "./App.css";
import { useContext } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Signup from "./pages/Signup.jsx";
import Homepage from "./pages/Homepage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { AuthContext } from "./AuthContext.jsx";
import { ThemeContext } from "./ThemeContext.jsx";
import Timeline from "./pages/Timeline.jsx";
import VideoUpload from "./pages/VideoUpload.jsx";
import Capture from "./pages/Capture.jsx";
import Montage from "./pages/Montage.jsx";
import Navbar from './components/Navbar.jsx'
import Upload from "./pages/Upload.jsx";
import StaticMontage from "./pages/StaticMontage.jsx";
function App() {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <>
      <BrowserRouter>
          <Navbar />

        <Routes>
            <Route path="/" element= {isLoggedIn?<Dashboard />:<Homepage />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route
              path="timelines"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                   <Timeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="Montages"
              element={
                 <StaticMontage />
              }
            />
            <Route
              path="montage"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Montage />
                </ProtectedRoute>
              }
            />
              <Route
              path="capture"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Capture />
                </ProtectedRoute>
              }
            />          
              <Route
              path="upload"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Upload />
                </ProtectedRoute>
              }
            />          
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;