import { useState } from "react";
import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import MyBooks from "./Components/MyBooks";
import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [books, setBooks] = useState([]); // ✅ initialize empty array

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"
      }`}
    >
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        setBooks={setBooks}
      />

      <Routes>
        <Route path="/" element={<Home books={books} />} />
        <Route path="/mybooks" element={<MyBooks books={books} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
