import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import ResumePage from "./Pages/MyResume.jsx";
import Preview from "./Pages/Preview.jsx";
import JobMatch from "./Pages/JobMatch.jsx"; // ✅ new import

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/resume" element={<ResumePage />} />
      <Route path="/preview/:id" element={<Preview />} />
      <Route path="/match/:id" element={<JobMatch />} /> {/* ✅ new route */}
    </Routes>
  );
}
