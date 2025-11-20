import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="main-container">
        <div className="left-container">
          <div className="heading">
            <p>User-1</p>
          </div>
          <div className="action">
            <input className="text" type="text"></input>
            <button className="send-btn">send</button>
          </div>
        </div>
        <div className="right-container">
          <div className="heading">
            <p>User-1</p>
          </div>
          <div className="action">
            <input className="text" type="text"></input>

            <button className="send-btn">send</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
