import { useState, useEffect } from "react";
import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import MyBooks from "./Components/MyBooks";
import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // ⬅ Lifted state here
  const [books, setBooks] = useState([]);
  useEffect(() => {
    fetch("http://localhost:3001/books")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error(err));
  }, []);
  return (
    <divBirthday
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"
      }`}
    >
      {/* Pass down state and setter */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        books={books}
        setBooks={setBooks}
      />

      <Routes>
        <Route path="/" element={<Home books={books} setBooks={setBooks} />} />
        <Route
          path="/mybooks"
          element={<MyBooks books={books} setBooks={setBooks} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </divBirthday>
  );
}

export default App;
