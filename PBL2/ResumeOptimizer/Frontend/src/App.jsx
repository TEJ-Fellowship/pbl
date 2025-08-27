import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import ResumePage from "./Pages/MyResume.jsx";
import Preview from "./Pages/Preview.jsx";

export default function App() {
  return (
    <Routes>

      <Route path="/" element={<Home/>} />
      <Route path="/resume" element={<ResumePage />} />
      <Route path="/preview/:id"element={<Preview/>}/>
    </Routes>
  );
} 

