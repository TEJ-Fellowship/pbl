// App.jsx
import { useState, useEffect } from "react";
import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import MyBooks from "./Components/MyBooks";
import Search from "./Components/Search";
import Browse from "./Components/Browse";
import { Routes, Route, Navigate } from "react-router-dom";
import InsightsPage from "./Components/InsightsPage";
import Signup from "./Components/Signup";
import Login from "./Components/Login";
import Profile from "./Components/Profile";
import { authFetch, handleApiError } from "./utils/api"; // Import the utility functions

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [books, setBooks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // Fetch books when user changes
  useEffect(() => {
    if (user) {
      fetchBooks();
    } else {
      setBooks([]);
    }
  }, [user]);

  const fetchBooks = async () => {
    try {
      // Use the authFetch utility instead of regular fetch
      const res = await authFetch("http://localhost:3001/api/books");

      // Handle API errors
      await handleApiError(res);

      const data = await res.json();
      setBooks(data);
    } catch (err) {
      console.error("Failed to fetch books:", err);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setBooks([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

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
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={<Home books={books} setBooks={setBooks} />}
          />
          <Route
            path="/mybooks"
            element={
              user ? (
                <MyBooks books={books} setBooks={setBooks} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/search"
            element={
              user ? (
                <Search books={books} setBooks={setBooks} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/browse/:category"
            element={
              user ? (
                <Browse books={books} setBooks={setBooks} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/insights/:bookId"
            element={
              user ? <InsightsPage books={books} /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/signup"
            element={
              !user ? <Signup onLogin={handleLogin} /> : <Navigate to="/" />
            }
          />
          <Route
            path="/login"
            element={
              !user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />
            }
          />
          <Route
            path="/profile"
            element={
              user ? (
                <Profile user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
