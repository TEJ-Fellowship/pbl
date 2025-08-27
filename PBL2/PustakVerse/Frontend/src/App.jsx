import { useState, useEffect } from "react";
import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import MyBooks from "./Components/MyBooks";
import Search from "./Components/Search";
// ADDED: Import Browse component
import Browse from "./Components/Browse";
import { Routes, Route, Navigate } from "react-router-dom";
import InsightsPage from "./Components/InsightsPage";
import Signup from "./Components/Sign"; // make sure filename is correct
import Login from "./Components/Login";
import Profile from "./Components/Profile";


function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [books, setBooks] = useState([]);
  const[user, setUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/books")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"
      }`}
    >
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        books={books}
        setBooks={setBooks}
        user={user}
        setUser={setUser}
      />

      <Routes>
        <Route path="/" element={<Home books={books} setBooks={setBooks} />} />
        <Route
          path="/mybooks"
          element={<MyBooks books={books} setBooks={setBooks} />}
        />
        <Route
          path="/search"
          element={<Search books={books} setBooks={setBooks} />}
        />
        {/* ADDED: Browse route with category parameter */}
        <Route
          path="/browse/:category"
          element={<Browse books={books} setBooks={setBooks} />}
        />
        <Route
          path="/insights/:bookId"
          element={<InsightsPage books={books} />}
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/profile" element={<Profile user={user} onLogout={() => setUser(null)} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
