import { useState } from "react";
import { Link } from "react-router-dom";
import service from "../../services/service";

const loginURL = import.meta.env.VITE_LOGIN_URL;


const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  console.log(email, "email");
  console.log(password, "password");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loginData = { email, password };

    service
      .create(loginURL, loginData)
      .then((response) => response.data)
      .catch((error) => console.log("Error on login", error));
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
        </form>
        <button>Sign In</button> {/* onClick={handleLogin} */}
        <p>
          Don't have an Account? <Link to="/register"> Sign Up</Link>
        </p>
      </div>
    </>
  );
};

export default LoginForm;
