import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function Signup() {
  const [user, setUser] = useState({
    id: "",
    username: "",
    email: "",
    password: "",
    confirmpassword: "",
  });
  const navigate = useNavigate();

  function handleChange(e) {
    let obj = { ...user, [e.target.name]: e.target.value };
    setUser(obj);
  }
  async function handleSubmit(e) {
    e.preventDefault();
    if (user.password !== user.confirmpassword) {
      alert("Passwords donot match!");
      return;
    }
try {
  const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
  const firebaseUser = userCredential.user;
  await setDoc(doc(db, "users", firebaseUser.uid), {
    uid: firebaseUser.uid,
    username: user.username,
    email: user.email,
  });
  alert("Signup Successful");
  navigate("/login");
} catch (error) {
  alert(error.message);
}

  }
  return (
    <form onSubmit={handleSubmit} className="flex items-center justify-center w-full h-[calc(100vh-4rem)] relative">
      <div className="absolute inset-0 bg-[url('/meditation2.jpg')] bg-cover bg-center bg-no-repeat opacity-30"></div>
      <div className="relative z-10 flex flex-col space-y-4 w-[350px] h-[400px] bg-[url('/meditation2.jpg')] bg-cover bg-center rounded-3xl shadow-lg p-6 pt-10 mt-12 ml-5 opacity-75  rounded-3xl">
        <h1 className="text-xl font-bold text-white text-center">Signup!</h1>
        <input
          type="text"
          name="username"
          value={user.username}
          onChange={handleChange}
          placeholder="Username"
          className="bg-transparent border border-white/80 rounded-3xl p-2 text-white placeholder-white/70"
        />
        <input
          type="text"
          name="email"
          onChange={handleChange}
          placeholder="Email"
          value={user.email}
          className="bg-transparent border border-white/80 rounded-3xl p-2 text-white placeholder-white/70"
        />
        <input
          type="password"
          onChange={handleChange}
          name="password"
          placeholder="Create Password"
          value={user.password}
          className="bg-transparent  border border-white/80 rounded-3xl p-2 text-white placeholder-white/70"
        />
        <input
          type="password"
          name="confirmpassword"
          onChange={handleChange}
          value={user.confirmpassword}
          placeholder="Confirm Password"
          className="bg-transparent  border border-white/80 rounded-3xl p-2 text-white placeholder-white/70"
        />
        <button
          type="submit"
          className="bg-blue-500/50 hover:bg-blue-600 text-white rounded-3xl py-2"
        >
          SIGNUP
        </button>
      </div>
    </form>
  );
}

export default Signup;
