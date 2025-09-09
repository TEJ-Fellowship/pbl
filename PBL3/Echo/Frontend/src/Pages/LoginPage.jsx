//src/Pages/LoginPage.jsx
import { useState, useEffect } from "react";
import axios from "axios";

function SignIn({
  username,
  setUsername,
  password,
  setPassword,
  setIsSignUp,
  setIsLoggedIn,
}) {
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
        }

        setUsername("");
        setPassword("");
      })
      .catch((err) => console.log(err));
  }

  return (
    <form
      className="bg-white p-9 rounded-2xl shadow-lg shadow-slate-400 w-80"
      onSubmit={handleSubmit}
    >
      <h1 className="text-2xl font-extrabold">Welcome Back</h1>
      <p className="mb-5">Please Enter your Account details</p>

      <p className="mb-2">Email</p>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="px-3 py-2 border-2 w-full border-green-600 focus:outline-none rounded-lg"
        type="text"
        placeholder="username@email.com"
      />

      <p className="mt-5 mb-2">Password</p>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-3 py-2 border-2 w-full border-green-600 focus:outline-none rounded-lg"
        type="password"
        placeholder="*******"
      />

      <p className="flex justify-end mt-1 text-sm underline text-green-700 cursor-pointer">
        Forgot Password
      </p>

      <button
        type="submit"
        className="mt-5 mb-5 p-2 w-full bg-green-600 rounded-lg text-white font-semibold"
      >
        Sign in
      </button>

      <p className="text-sm text-center">
        Don't have an Account?{" "}
        <span
          className="text-green-700 font-semibold hover:text-green-800 cursor-pointer"
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

    if (password === repassword) {
      axios
        .post("http://localhost:3001/signup", { username, password })
        .then((response) => {
          alert(
            `The account is created with username: ${response.data.username}`
          );
          setIsSignUp(false);
        })
        .catch((err) => console.log("Error:", err));
    } else {
      alert("Please confirm your password. Try again...");
    }

    setPassword("");
    setUsername("");
    setRepassword("");
  }

  return (
    <form
      className="bg-white p-9 rounded-2xl shadow-lg shadow-slate-400 w-80"
      onSubmit={handleSubmit}
    >
      <h1 className="text-2xl font-extrabold">Create an account</h1>
      <p className="mb-5">Please Enter your Account details</p>

      <p className="mb-2">Email</p>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="px-3 py-2 border-2 w-full border-green-600 focus:outline-none rounded-lg"
        type="text"
        placeholder="username@email.com"
      />

      <p className="mt-5 mb-2">Password</p>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-3 py-2 border-2 w-full border-green-600 focus:outline-none rounded-lg"
        type="password"
        placeholder="*******"
      />

      <p className="mt-5 mb-2">Re-enter password</p>
      <input
        value={repassword}
        onChange={(e) => setRepassword(e.target.value)}
        className="px-3 py-2 border-2 w-full border-green-600 focus:outline-none rounded-lg"
        type="password"
        placeholder="*******"
      />

      <button
        type="submit"
        className="mt-5 mb-5 p-2 w-full bg-green-600 rounded-lg text-white font-semibold"
      >
        Sign Up
      </button>

      <p className="text-sm text-center">
        Already have an Account?{" "}
        <span
          className="text-green-700 font-semibold hover:text-green-800 cursor-pointer"
          onClick={() => {
            setIsSignUp(false);
            setUsername("");
            setPassword("");
            setRepassword("");
          }}
        >
          Sign In
        </span>
      </p>
    </form>
  );
}

// function Dashboard({ handleLogout }) {
//   return (
//     <div className="bg-white p-9 rounded-2xl shadow-lg shadow-slate-400 w-96 text-center">
//       <h1 className="text-2xl font-bold mb-4">✅ You are logged in!</h1>
//       <button
//         onClick={handleLogout}
//         className="mt-5 p-2 w-full bg-red-600 rounded-lg text-white font-semibold"
//       >
//         Logout
//       </button>
//     </div>
//   );
// }

function LoginForm({ setIsLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  // const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ check if token exists on mount
  // useEffect(() => {
  //   const token = localStorage.getItem("token"); // fixed typo
  //   if (token) {
  //     setIsLoggedIn(true);
  //   }
  // }, []);

  // function handleLogout() {
  //   localStorage.removeItem("token");
  //   setIsLoggedIn(false);
  // }

  return (
    <div className="h-screen flex justify-center items-center">
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
