import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import service from "../../services/service";

const loginURL = import.meta.env.VITE_LOGIN_URL;

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    const loginData = { email, password };
    try {
      service.create(loginURL, loginData).then((response) => {
        localStorage.setItem("token", JSON.stringify(response.token));
        setUsers(response);
        navigate("/dashboard");
      });
    } catch (error) {
      console.log("Error on login", error);
    }
    setEmail("");
    setPassword("");
  };

  return (
    <>
      <div>
        <p>SkillUp AI</p>
        <form onSubmit={handleSubmit}>
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
          <button>Sign In</button> {/* onClick={handleLogin} */}
        </form>
        <p>
          Don't have an Account? <Link to="/register"> Sign Up</Link>
        </p>
      </div>
    </>
  );
};

export default LoginForm;
