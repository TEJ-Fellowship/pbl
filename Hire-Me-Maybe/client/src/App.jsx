import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Signup from "./components/Signup";
import Login from "./components/Login";

const App = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("loggedUser")) || null
  );
  const [view, setView] = useState("signup");

  const handleSignup = () => {
    toast.success("Signup successful! Please log in.");
    setView("login");
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("loggedUser", JSON.stringify(userData));
    toast.success(`Welcome back, ${userData.username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    setUser(null);
    setView("login");
    toast.info("You have been logged out.");
  };

  return (
    <div>
      {user ? (
        <div>
          <h1>Welcome, {user.username}</h1>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <>
          {view === "signup" ? (
            <>
              <Signup onSignup={handleSignup} />
              <p>
                Already have an account?{" "}
                <button onClick={() => setView("login")}>Login</button>
              </p>
            </>
          ) : (
            <>
              <Login onLogin={handleLogin} />
              <p>
                Don't have an account?{" "}
                <button onClick={() => setView("signup")}>Signup</button>
              </p>
            </>
          )}
        </>
      )}

      {/* Toast notifications container */}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default App;
