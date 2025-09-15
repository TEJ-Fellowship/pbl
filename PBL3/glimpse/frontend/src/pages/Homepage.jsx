import React from "react";
import { useNavigate } from "react-router-dom";

function Homepage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen-[20px]">
      <button onClick={() => navigate("/login")}>Login</button>
      <button onClick={() => navigate("/signup")}>SignIn</button>
      <p>Hello world</p>
    </div>
  );
}

export default Homepage;
