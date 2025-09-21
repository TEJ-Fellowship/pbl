
import "./App.css";
import { useContext } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Signup from "./pages/Signup.jsx";
import Homepage from "./pages/Homepage.jsx";
import Aboutus from "./pages/Aboutus.jsx";
// import Layout from "./Layout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { AuthContext } from "./AuthContext.jsx";
import { ThemeContext } from "./ThemeContext.jsx";
import Timeline from "./pages/Timeline.jsx";
import VideoUpload from "./pages/VideoUpload.jsx";
import Capture from "./pages/Capture.jsx";
import Montage from "./pages/Montage.jsx";
import Navbar from './components/Navbar.jsx'
function App() {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const { isDark} = useContext(ThemeContext);

  return (
    <>
      <BrowserRouter>
          <Navbar />

        <Routes>
            <Route path="/" element= {<Homepage />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route
              path="timelines"
              element={
                <ProtectedRoute>
                   <Timeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="create"
              element={
                <ProtectedRoute>
                 <Aboutus />
                </ProtectedRoute>
              }
            />
            <Route path="About" element={<Aboutus />} />
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
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;