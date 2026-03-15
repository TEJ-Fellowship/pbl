// src/Pages/LoginPage.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../Components/useAlert";

function SignIn({
  username,
  setUsername,
  password,
  setPassword,
  setIsSignUp,
  setIsLoggedIn,
}) {
  const navigate = useNavigate();
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { showAlert, AlertComponent } = useAlert();
  const [newPassword, setNewPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const userObj = { username, password };

    axios
      .post("http://localhost:3001/signin", userObj)
      .then((response) => {
        const token = response.data.token;
        if (token) {
          localStorage.setItem("token", token);
          setIsLoggedIn(true);
          navigate("/home");
        }
        setUsername("");
        setPassword("");
        showAlert('Login Failed! Incorrect username or password', 'error');
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          showAlert(err.response.data, "error");
          console.error("Login error:", err.response.data);
        } else {
          showAlert("Login failed. Please try again later.", "error");
          console.error("Unexpected login error:", err);
        }
      });
  }

  const handleForgotPassword = async () => {
    if (!resetEmail || !newPassword)
      return showAlert("Please enter username and new password", "error");

    try {
      const res = await axios.post("http://localhost:3001/forgot-password", {
        username: resetEmail,
        newPassword,
      });

      showAlert(res.data?.message || "Password updated successfully!", "success");
      setShowForgotModal(false);
      setResetEmail("");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      if (err?.response?.data?.message) {
        showAlert(err.response.data.message, "error");
      } else {
        showAlert("Failed to update password. Please try again.", "error");
      }
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="w-80 sm:w-96 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col gap-4 text-white"
      >
        {/* Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform duration-300">
              <img src="/logo.svg" alt="logo" />
            </div>
            <div className="text-lg font-semibold">Echo</div>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-white">Welcome Back</h1>
        <p className="text-gray-400">Enter your account details</p>

        <label className="mt-2 mb-1 text-sm font-semibold text-gray-300">Email</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          placeholder="you@domain.com"
          className="px-3 py-2 w-full bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400
                     focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
        />

        <label className="mt-2 mb-1 text-sm font-semibold text-gray-300">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="*******"
          className="px-3 py-2 w-full bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400
                     focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
        />

        {/* Forgot Password Button */}
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-indigo-300 hover:text-indigo-400 underline"
            onClick={() => setShowForgotModal(true)}
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          className="mt-2 p-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white
                     font-semibold rounded-lg transition-colors shadow"
        >
          Sign In
        </button>

        <p className="text-sm text-center text-gray-400 mt-1">
          Don't have an account?{" "}
          <span
            className="text-indigo-300 font-semibold hover:text-indigo-400 cursor-pointer"
            onClick={() => {
              setIsSignUp(true);
              setUsername("");
              setPassword("");
            }}
          >
            Sign Up
          </span>
        </p>
      </form>

      {/* Forgot Password Modal */}
      {showForgotModal && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-slate-900/95 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl p-8 w-80 sm:w-96 flex flex-col gap-4 text-white relative">
      <h2 className="text-xl font-bold text-white">Reset Password</h2>
      <p className="text-gray-400 text-sm">Enter your username and new password</p>

      <input
        type="text"
        value={resetEmail}
        onChange={(e) => setResetEmail(e.target.value)}
        placeholder="Username"
        className="px-3 py-2 w-full bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400
                   focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
      />

      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New Password"
        className="px-3 py-2 w-full bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400
                   focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
      />

      <div className="flex justify-end gap-2 mt-2">
        <button
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition"
          onClick={() => {
            setShowForgotModal(false);
            setResetEmail("");
            setNewPassword("");
          }}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
          onClick={handleForgotPassword}
        >
          Update
        </button>
      </div>
    </div>
    {AlertComponent}
  </div>
)}


      {/* Render alert component so showAlert() messages are visible for SignIn flows */}
      {AlertComponent}
    </>
  );
}

function SignUp({ username, setUsername, password, setPassword, setIsSignUp }) {
  const [repassword, setRepassword] = useState("");
  const { showAlert, AlertComponent } = useAlert();

  function handleSubmit(e) {
    e.preventDefault();
    if (password !== repassword) return showAlert("Passwords do not match!", "error");

    axios
      .post("http://localhost:3001/signup", { username, password })
      .then((response) => {
        showAlert(`Account created: ${response.data.username}`, "success");
        setIsSignUp(false);
      })
      .catch((err) => {
        console.log("Error:", err);
        if (err?.response?.data?.message) {
          showAlert(err.response.data.message, "error");
        } else {
          showAlert("Failed to create an account. Please try again.", "error");
        }
      });

    setUsername("");
    setPassword("");
    setRepassword("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-80 sm:w-96 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col gap-4 text-white"
    >
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform duration-300">
            <img src="/logo.svg" alt="logo" />
          </div>
          <div className="text-lg font-semibold">Echo</div>
        </div>
      </div>

      <h1 className="text-2xl font-extrabold text-white">Create Account</h1>
      <p className="text-gray-400">Enter your account details</p>

      <label className="mt-2 mb-1 text-sm font-semibold text-gray-300">
        Email
      </label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        type="text"
        placeholder="you@domain.com"
        className="px-3 py-2 w-full bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400
                   focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
      />

      <label className="mt-2 mb-1 text-sm font-semibold text-gray-300">
        Password
      </label>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="*******"
        className="px-3 py-2 w-full bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400
                   focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
      />

      <label className="mt-2 mb-1 text-sm font-semibold text-gray-300">
        Re-enter Password
      </label>
      <input
        value={repassword}
        onChange={(e) => setRepassword(e.target.value)}
        type="password"
        placeholder="*******"
        className="px-3 py-2 w-full bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400
                   focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
      />

      <button
        type="submit"
        className="mt-2 p-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white
                   font-semibold rounded-lg transition-colors shadow"
      >
        Sign Up
      </button>

      <p className="text-sm text-center text-gray-400 mt-1">
        Already have an account?{" "}
        <span
          className="text-indigo-300 font-semibold hover:text-indigo-400 cursor-pointer"
          onClick={() => setIsSignUp(false)}
        >
          Sign In
        </span>
      </p>

      {/* Alert component for SignUp flows */}
      {AlertComponent}
    </form>
  );
}

function LoginForm({ setIsLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 p-6">
      {isSignUp ? (
        <SignUp
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          setIsSignUp={setIsSignUp}
        />
      ) : (
        <SignIn
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          setIsSignUp={setIsSignUp}
          setIsLoggedIn={setIsLoggedIn}
        />
      )}
    </div>
  );
}

export default LoginForm;
