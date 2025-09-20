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
      className="bg-white p-9 rounded-2xl shadow-lg shadow-slate-400 w-80
                 sm:w-96 flex flex-col gap-3"
    >
      <h1 className="text-2xl font-extrabold text-blue-600">Welcome Back</h1>
      <p className="text-gray-600">Enter your account details</p>

      <label className="mt-4 mb-1 text-sm font-semibold text-gray-700">
        Email
      </label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        type="text"
        placeholder="username@email.com"
        className="px-3 py-2 w-full border-2 border-gray-300 rounded-lg
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />

      <label className="mt-4 mb-1 text-sm font-semibold text-gray-700">
        Password
      </label>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="*******"
        className="px-3 py-2 w-full border-2 border-gray-300 rounded-lg
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />

      <p className="text-sm text-blue-500 underline cursor-pointer text-right mt-1">
        Forgot Password?
      </p>

      <button
        type="submit"
        className="mt-5 p-2 w-full bg-blue-600 hover:bg-blue-700 text-white
                   font-semibold rounded-lg transition-colors"
      >
        Sign In
      </button>

      <p className="text-sm text-center text-gray-600 mt-2">
        Don't have an account?{" "}
        <span
          className="text-blue-500 font-semibold hover:text-blue-600 cursor-pointer"
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
      className="bg-white p-9 rounded-2xl shadow-lg shadow-slate-400 w-80
                 sm:w-96 flex flex-col gap-3"
    >
      <h1 className="text-2xl font-extrabold text-blue-600">Create Account</h1>
      <p className="text-gray-600">Enter your account details</p>

      <label className="mt-4 mb-1 text-sm font-semibold text-gray-700">
        Email
      </label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        type="text"
        placeholder="username@email.com"
        className="px-3 py-2 w-full border-2 border-gray-300 rounded-lg
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />

      <label className="mt-4 mb-1 text-sm font-semibold text-gray-700">
        Password
      </label>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="*******"
        className="px-3 py-2 w-full border-2 border-gray-300 rounded-lg
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />

      <label className="mt-4 mb-1 text-sm font-semibold text-gray-700">
        Re-enter Password
      </label>
      <input
        value={repassword}
        onChange={(e) => setRepassword(e.target.value)}
        type="password"
        placeholder="*******"
        className="px-3 py-2 w-full border-2 border-gray-300 rounded-lg
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />

      <button
        type="submit"
        className="mt-5 p-2 w-full bg-blue-600 hover:bg-blue-700 text-white
                   font-semibold rounded-lg transition-colors"
      >
        Sign Up
      </button>

      <p className="text-sm text-center text-gray-600 mt-2">
        Already have an account?{" "}
        <span
          className="text-blue-500 font-semibold hover:text-blue-600 cursor-pointer"
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
    <div className="h-screen flex justify-center items-center bg-gray-50">
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
