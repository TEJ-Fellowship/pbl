
import "./App.css";
import { useContext } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Signup from "./pages/Signup.jsx";
import Homepage from "./pages/Homepage.jsx";
import Aboutus from "./pages/Aboutus.jsx";
import Layout from "./Layout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { AuthContext } from "./AuthContext.jsx";
import { ThemeContext } from "./ThemeContext.jsx";
import Timeline from "./pages/Timeline.jsx";
import VideoUpload from "./pages/VideoUpload.jsx";

function App() {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const { isDark} = useContext(ThemeContext);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} />
            }
          >
            <Route index element={isLoggedIn ? <Dashboard /> : <Homepage />} />
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
              path="account"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Aboutus />
                </ProtectedRoute>
              }
            />
              <Route
              path="videoupload"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <VideoUpload />
                </ProtectedRoute>
              }
            />
          </Route>
          
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;