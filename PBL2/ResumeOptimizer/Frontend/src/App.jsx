import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import ResumePage from "./Pages/MyResume.jsx";
import Preview from "./Pages/Preview.jsx";
import LandingPage from "./Pages/LandingPage.jsx";
import LoginSignup from "./components/loginsignup/LoginSignup.jsx";
import JobMatch from "./Pages/JobMatch.jsx"; 

export default function App() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/signup" element={<LoginSignup/>} />
      <Route path="/login" element={<LoginSignup/>} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/resume" element={<ResumePage />} />
      <Route path="/preview/:id" element={<Preview />} />
      <Route path="/match/:id" element={<JobMatch />} />
    </Routes>
  );
}
