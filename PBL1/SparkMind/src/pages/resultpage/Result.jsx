import "./Result.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
const Result = () => {
  const navigate = useNavigate();
  const location = useLocation(); //added the location hook to receive data passed as navigate("/result", { state: { score } });

  const { score, duration } = location.state || { score: 0, duration: 30 }; //read the score
  const [highScore, setHighScore] = useState({ score: 0, duration: 30 });
  const handlePlay = () => {
    navigate("/");
  };

  useEffect(() => {
    const saved = localStorage.getItem("highScore");
    const prevHigh = saved ? JSON.parse(saved) : { score: 0, duration: 30 };

    if (
      score > prevHigh.score ||
      (score === prevHigh.score && duration < prevHigh.duration)
    ) {
      setHighScore({ score, duration });
      localStorage.setItem("highScore", JSON.stringify({ score, duration }));
    } else {
      setHighScore(prevHigh);
    }
  }, []);

  return (
    <div>
      <div className="resultWrapper">
        <div className="resultContainer">
          <div className="fraction">
            <span className="score">{score}</span>
            <span className="total">/5</span>
            <br />
            <span style={{ color: "grey" }}>correct!</span>
          </div>
          <br />
          <span>⏱️ Time Taken: {duration}s</span>

          <p>
            🏆 High Score: {highScore.score} in {highScore.duration}s
          </p>

          {/* <p className="tagline">Keep Shining!</p> */}
          <button className="playBtn" onClick={handlePlay}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;
