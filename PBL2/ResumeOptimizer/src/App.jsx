import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import Resume from "./Pages/Resume.jsx";
import NavFeature from "./Pages/NavFeature.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<><Home /><NavFeature /></>} />
      <Route path="/resume" element={<Resume />} />
    </Routes>
  );
} 
