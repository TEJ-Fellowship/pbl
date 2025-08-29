import { useState } from "react";
import service from "../../services/service";
import { Link } from "react-router-dom";
const registerURL = import.meta.env.VITE_REGISTER_URL;

const RegistrForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState()
  const [token, setToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { fullName, email, password };
    service
      .create(registerURL, data)
      .then((response) => {
       setUsers(response);
        setToken(response.token);
      })
      .catch((error) => console.log(error, "this is error"));

    setFullName("");
    setEmail("");
    setPassword("");
  };

  console.log("token is ", token);
  localStorage.setItem("token", JSON.stringify(token));

  return (
    <>
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
export default RegistrForm;
