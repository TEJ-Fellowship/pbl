import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RecordNote from "./pages/RecordNote";
import MyNote from "./pages/MyNote";
import { MoveLeft } from "lucide-react";

function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token && !user) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          username: payload.email?.split("@")[0] || payload.username || "User",
        });
      } catch {
        // Invalid token, ignore
      }
    }
  }, []);

  // Handlers to switch pages
  const handleGoToLogin = () => setPage("login");
  const handleGoToSignup = () => setPage("signup");
  const handleGoToHome = () => setPage("home");
  const handleGoToRecordNote = () => setPage("record");
  const handleGoToVoiceNotes = () => setPage("voice-notes");

  // Handle login success: set user and go home
  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    setPage("home");
  };

  // Logout handler
  const handleLogout = () => {
    Cookies.remove("token");
    setUser(null);
    setPage("home");
  };

  return (
    <>
      {page === "home" && (
        <Home
          onLogin={handleGoToLogin}
          onSignup={handleGoToSignup}
          username={user?.username}
          onLogout={user ? handleLogout : undefined}
          onRecord={user ? handleGoToRecordNote : undefined}
          onVoiceNotes={user ? handleGoToVoiceNotes : undefined}
        />
      )}
      {page === "login" && (
        <Login
          onSwitchToSignup={handleGoToSignup}
          onClose={handleGoToHome}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {page === "signup" && (
        <Register onSwitchToLogin={handleGoToLogin} onClose={handleGoToHome} />
      )}
      {page === "record" && (
        <RecordNote
          onClose={handleGoToHome}
          onSave={() => {
            handleGoToVoiceNotes();
          }}
        />
      )}
      {page === "voice-notes" && (
        <div>
          <div className="p-4 bg-white shadow-sm mb-4 flex items-center justify-between">
            <button
              className="text-blue-500 hover:text-blue-600"
              onClick={handleGoToHome}
            >
              <div className="flex items-center gap-2 cursor-pointer">
                <MoveLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </div>
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              onClick={handleGoToRecordNote}
            >
              Record New Note
            </button>
          </div>
          <MyNote />
        </div>
      )}
      <ToastContainer position="top-center" autoClose={2000} />
    </>
  );
}

export default App;
