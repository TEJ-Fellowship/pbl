import "./Result.css";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
const Result = () => {
  const navigate = useNavigate();
  const location = useLocation(); //added the location hook to receive data passed as navigate("/result", { state: { score } });

  const score = location.state?.score || 0; //read the score
  const handlePlay = () => {
    navigate("/quiz");
  };
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
          <p className="tagline">Keep Shining!</p>
          <button className="playBtn" onClick={handlePlay}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;
