import "./Quiz.css";
import React, { useState, useEffect } from "react";
import Quiz_timer from "./Quiz_timer";
import { useNavigate } from "react-router-dom";
import { GoogleGenAI } from "@google/genai";
import { useLocation } from "react-router-dom";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });

function Quiz() {
  const location = useLocation();

  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Choose any index
  const [feedback, setFeedback] = useState("");
  const [clicked, setClicked] = useState(false);
  const [optionSelected, setOptionSelected] = useState(false);
  const [ourOptions, setOurOptions] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const topic = location.state;

  const correctAudio = new Audio("/Sounds/correct.mp3");
  const wrongAudio = new Audio("/Sounds/wrong.mp3");
  const startAudio = new Audio("/Sounds/start.mp3");
  const endAudio = new Audio("/Sounds/end.mp3");

  useEffect(() => {
    if (questions.length > 0 && !startTime) {
      setStartTime(Date.now());
    }
  }, [questions]);

  const handleResults = () => {
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    navigate("/result", { state: { score, duration } }); //sending score along with navigation
  };

  const fetchData = async () => {
    try {
      const quizPrompt = `Generate a quiz with exactly 5 multiple-choice questions about ${topic} or any random topic if no topic is provided.
      Return ONLY a valid JSON object with no explanations or markdown. Format it like this:
      [
    {
      "id": 1,
      "topic": "string",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    }
  ]`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: quizPrompt,
      });
      let cleanedResponse = response.text
        .replace(/```json\n?/g, "") // Remove ```json
        .replace(/```\n?/g, "") // Remove ```
        .trim(); // Remove extra whitespace
      console.log(response.text);
      // const data = await response.json();

      const data = JSON.parse(cleanedResponse);

      console.log(data);
      const formatted = data.map((item) => {
        const allOptions = shuffleArray([...item.options]);
        return {
          id: item.id,
          topic: item.topic,
          question: item.question,
          options: allOptions,
          answer: item.answer,
        };
      });
      console.log(formatted);
      setQuestions(formatted);
    } catch (error) {
      console.error("Error:", error);
      setError("404 - Failed to load quiz.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (timeUp) {
      handleResults();
    }
  }, [timeUp]);

  useEffect(() => {
    if (questions.length > 0) {
      const currentItem = questions[currentIndex];
      const shuffled = shuffleArray(currentItem.options);
      setOurOptions(shuffled);
      setClicked(false);
      setOptionSelected(false);
      setFeedback("");
    }
  }, [currentIndex, questions]);

  const shuffleArray = (array) => {
    const copied = [...array];
    for (let i = copied.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copied[i], copied[j]] = [copied[j], copied[i]];
    }
    return copied;
  };

  const answerCheck = (option) => {
    if (clicked) return;
    setClicked(true);
    setSelectedOption(option);
    setOptionSelected(true);

    if (option === questions[currentIndex].answer) {
      setFeedback("Wow! You are correct");
      setIsCorrect(true);
      correctAudio.play();
      setScore((prev) => prev + 1);
    } else {
      setFeedback(`Oops! Correct answer is ${questions[currentIndex].answer}`);
      setIsCorrect(false);
      wrongAudio.play();
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setClicked(false);
      setFeedback("");
    } else {
      handleResults();
    }
  };

  if (questions.length === 0) {
    return (
      <>
        {/* <div className="loader"></div> */}
        <div className="ai-loader">
          Generating<span className="dots"></span>
        </div>
      </>
    );
  }

  const currentItem = questions[currentIndex];

  return (
    <div className="container">
      {error && (
        <div style={{ color: "red", textAlign: "center", marginTop: "20px" }}>
          {error}
        </div>
      )}
      <div className="question-card">
        {!timeUp && <Quiz_timer setTimeUp={setTimeUp} />}

        <h2 className="question-title">{currentItem.question}</h2>
        <p className="topic">{currentItem.topic}</p>
        <hr className="underline" />

        <div className="options">
          {ourOptions.map((option, index) => (
            <h3
              key={index}
              className={`option1 ${clicked ? "disabled" : ""}`}
              onClick={() => {
                answerCheck(option);
                setSelectedOption(index);
              }}
              style={{
                padding: "10px 20px",
                border: "1px solid #ccc",
                cursor: "pointer",
                backgroundColor:
                  selectedOption === index
                    ? isCorrect
                      ? "#21F14F"
                      : "#FF3131"
                    : "white",
                color: selectedOption === index ? "white" : "black",
                borderRadius: "5px",
              }}
            >
              {option}
            </h3>
          ))}
        </div>

        <div className="quizController">
          <h3 className={isCorrect ? "correct" : "incorrect"}>{feedback}</h3>
          <h3
            className={`next ${optionSelected ? "active" : "disabled"}`}
            onClick={() => {
              setSelectedOption(null);
              if (!optionSelected) return;

              if (currentIndex === questions.length - 1) {
                handleResults();
              } else {
                handleNext();
              }
            }}
          >
            {currentIndex === questions.length - 1 ? "View Results" : "Next"}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
