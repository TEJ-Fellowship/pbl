// src/Pages/LoginPage.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function SignIn({
  username,
  setUsername,
  password,
  setPassword,
  setIsSignUp,
  setIsLoggedIn,
}) {
  const navigate = useNavigate();

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
      })
      .catch((err) => console.log(err));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-80 sm:w-96 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col gap-4 text-white"
    >
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-full  flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform duration-300 w-14 h-14">
            <img src="/logo.svg" alt="logo" />
          </div>
          <div className="text-lg font-semibold">Echo</div>
        </div>
      </div>

      <h1 className="text-2xl font-extrabold text-white">Welcome Back</h1>
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

      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm text-indigo-300 hover:text-indigo-400 underline"
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
  );
}

function SignUp({ username, setUsername, password, setPassword, setIsSignUp }) {
  const [repassword, setRepassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (password !== repassword) return alert("Passwords do not match!");

    axios
      .post("http://localhost:3001/signup", { username, password })
      .then((response) => {
        alert(`Account created: ${response.data.username}`);
        setIsSignUp(false);
      })
      .catch((err) => console.log("Error:", err));

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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center font-bold">
            E
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
