// src/components/Auth/RegisterForm.jsx

import { useState } from "react";
import service from "../../services/service";
import { Link, useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
const registerURL = import.meta.env.VITE_REGISTER_URL;

const RegisterForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { isAuthenticated, setIsAuthenticated, user } = useContext(AuthContext);
  console.log(user.fullName,"this is user name in register");

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace state={{ user: user }}/>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      fullName: fullName.trim(),
      email: email.trim(),
      password: password.trim(),
    };


      if (!fullName.trim() || !email.trim() || !password.trim()) {
        setError("All fields are required");
         setTimeout(()=>{
        setError(""); 
      },500)
        return;
      }
    
    try {
      const response = await service.create(registerURL, data);

      if (!response.token) {
        console.log("no token in register after submit", response.token);
        return;
      } else {
        localStorage.setItem("token", response.token);
        console.log(response.token, "token after register");
        setIsAuthenticated(true);
        navigate("/dashboard", { state: { user: response.user } });
        setFullName("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.log(error, "this is error");
    }
  };
  return (
    <>
      {error && <div>{error}</div>}
      <div>
        <form onSubmit={handleSubmit}>
          <p>SkillUp AI</p>
          <p>
            Full Name:{" "}
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              type="text"
              placeholder="type full name"
            ></input>
          </p>
          <p>
            Email:{" "}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="type email"
            ></input>
          </p>
          <p>
            Password:{" "}
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="type password"
            ></input>
          </p>
          <button>Sign Up</button>
          <p>
            Already have an Account? <Link to="/login"> Sign In</Link>
          </p>
        </form>
      </div>
    </>
  );
};
export default RegisterForm;
