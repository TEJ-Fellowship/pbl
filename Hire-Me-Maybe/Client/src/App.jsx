import { useState } from "react";
import Signup from "./components/Signup";
import ResumeUpload from "./components/resume/ResumeUpload";

const App = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("loggedUser")) || null
  );

  const handleSignup = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <div>
          <h1>Welcome, {user.user.username}</h1>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <Signup onSignup={handleSignup} />
      )}
      <ResumeUpload />
    </div>
  );
};

export default App;
