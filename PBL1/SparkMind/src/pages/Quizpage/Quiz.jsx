import "./Quiz.css";
import React, { useState } from "react";
import Quiz_timer from "./Quiz_timer";
import questions from "./questions.json";
import { useNavigate } from "react-router-dom";
function Quiz() {
  const navigate = useNavigate();
  const handleResults = () => {
    navigate("/result");
  };
  const [currentIndex, setCurrentIndex] = useState(3);
  const [feedback, setFeedback] = useState("");
  const currentItem = questions[currentIndex];

  // Shuffle logic
  function shuffleArray(array) {
    const copied = [...array];
    for (let i = copied.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copied[i], copied[j]] = [copied[j], copied[i]];
    }
    return copied;
  }

  // Shuffle only once
  const [ourOptions] = useState(() => shuffleArray(currentItem.options));

  function answerCheck(option) {
    if (option === currentItem.answer) {
      setFeedback("Wow! You are correct");
    } else {
      setFeedback(`Oops! Correct answer is ${currentItem.answer}`);
    }
  }

  return (
    <div className="container">
      <div className="question-card">
        <Quiz_timer />

        <h2 className="question-title">{currentItem.question}</h2>
        <p className="topic" id="topic">
          {currentItem.topic}
        </p>
        <hr className="underline" />

        <div className="option-container">
          <div className="options">
            <h3
              className="option1"
              onClick={() => {
                answerCheck(ourOptions[0]);
              }}
            >
              {ourOptions[0]}
            </h3>
            <h3
              className="option1"
              onClick={() => {
                answerCheck(ourOptions[1]);
              }}
            >
              {ourOptions[1]}
            </h3>
            <h3
              className="option1"
              onClick={() => {
                answerCheck(ourOptions[2]);
              }}
            >
              {ourOptions[2]}
            </h3>
            <h3
              className="option1"
              onClick={() => {
                answerCheck(ourOptions[3]);
              }}
            >
              {ourOptions[3]}
            </h3>
          </div>

          <h3 className="feedback">{feedback}</h3>
          <h3 className="next" onClick={handleResults}>
            {" "}
            View Results
          </h3>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
