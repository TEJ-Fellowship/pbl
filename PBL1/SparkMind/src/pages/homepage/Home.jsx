import { useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
const Home = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");

  const handlePlay = () => {
    navigate("/quiz", { state: topic });
  };

  return (
    <div className="homeWrapper">
      <div className="homeContainer">
        <h1 className="logo">Spark Mind</h1>
        <p className="tagline">Play 30s Quiz</p>
        <input
          type="text"
          name=""
          id="inputTopic"
          placeholder="enter topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button className="playBtn" onClick={handlePlay}>
          Play
        </button>
      </div>
    </div>
  );
};

export default Home;
