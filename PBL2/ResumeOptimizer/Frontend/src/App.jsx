import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import Resume from "./Pages/MyResume.jsx";
import Preview from "./Pages/Preview.jsx";

export default function App() {
  return (
    <Routes>

      <Route path="/" element={<Home/>} />
      <Route path="/resume" element={<Resume />} />
      <Route path='/preview' element={<Preview/>}/>
    </Routes>
  );
} 

