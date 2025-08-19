import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import MyBooks from "./Components/MyBooks";
import { Routes, Route, Navigate } from "react-router-dom";
import Form from "./Components/Form";
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mybooks" element={<MyBooks />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
