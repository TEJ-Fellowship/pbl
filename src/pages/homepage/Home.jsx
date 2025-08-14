import { useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
const Home = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  // const [loading, setLoading] = useState(false);

  const handlePlay = () => {
    navigate("/quiz", { state: topic });
  };

  return (
    <div className="homeWrapper">
      <div className="homeContainer">
        {/* <h1 className="logo">Spark Mind</h1> */}
        <div className="logo">
          <img
            src="/public/SparkMind_UI/logo.png"
            alt=""
            height="200px"
            width="200px"
          />
          <h2 className="logoName">Spark Mind</h2>
        </div>
        <p className="tagline">Play 60s Quiz</p>
        <span>
          <input
            type="text"
            name=""
            id="inputTopic"
            placeholder="Enter a topic to start"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </span>

        <button className="playBtn" onClick={handlePlay}>
          <span>Play </span>
        </button>
      </div>
    </div>
  );
};

export default Home;
