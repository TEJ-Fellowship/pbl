import { useState } from "react";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  console.log(email, "email");
  console.log(password, "password");

  // const handleLogin=()={

  // }
  return (
    <>
      <div>
        <p>SkillUp AI</p>
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

        <p>Don't have Account? Sign Up</p>
      </div>
    </>
  );
};

export default LoginForm;
