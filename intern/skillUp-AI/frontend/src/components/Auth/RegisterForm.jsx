import { useState } from "react";
import service from "../../services/service";

const RegistrForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  console.log(fullName, "fullName");
  console.log(email, "email");
  console.log(password, "password");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { fullName, email, password };
    service
      .create(data)
      .then((response) => response.data)
      .catch((error) => console.log(error, "this is error"));
  };

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
          <p>Already have Account? Sign In</p>
        </form>
      </div>
    </>
  );
};
export default RegistrForm;
