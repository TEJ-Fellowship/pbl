import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "../AuthContext";
import { ThemeContext } from "../ThemeContext";
function Login() {
  const {isDark}=useContext(ThemeContext)
  const [loginUser, setLoginUser] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const {login}=useContext(AuthContext)
  function handleChange(e) {
    let obj = { ...loginUser, [e.target.name]: e.target.value };
    setLoginUser(obj);
  }
  async function handleSubmit(e) {
    e.preventDefault();
    if (loginUser.password == "") {
      alert("Passwords field is empty");
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginUser.email,
        loginUser.password
      );
      const firebaseUser=userCredential.user;
      const token=await firebaseUser.getIdToken();
      localStorage.setItem('token',token)
      login();
      navigate("/dashboard"); 
    } catch (error) {
      alert(error.message);
    }
  }
  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)] relative">
      <div className="absolute top-0 inset-0 bg-[url('/meditation2.jpg')] bg-cover bg-center bg-no-repeat opacity-30"></div>
      <div className="relative z-10 flex flex-col space-y-4 w-[300px] h-[300px] bg-[url('/meditation2.jpg')] bg-cover bg-center rounded-3xl shadow-lg p-6 pt-10 mt-12 ml-5 opacity-75  rounded-3xl">
        <h1 className="text-2xl font-bold  text-[#CC5500] text-center">Welcome!</h1>
        <input
          type="text"
          name="email"
          value={loginUser.email}
          onChange={handleChange}
          placeholder="Email"
          className="bg-transparent border border-white/80 rounded-3xl p-2 text-white placeholder-white/70"
        />
        <input
          type="password"
          name="password"
          value={loginUser.password}
          onChange={handleChange}
          placeholder="Password"
          className="bg-transparent  border border-white/80 rounded-3xl p-2 text-white placeholder-white/70"
        />
        <button
          type="submit"
          onClick={handleSubmit}
          className="bg-blue-500/50 hover:bg-blue-600 text-white rounded-3xl py-2"
        >
          LOGIN
        </button>
      </div>
    </div>
  );
}

export default Login;
