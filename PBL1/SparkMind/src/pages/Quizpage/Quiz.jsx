import "./Quiz.css";
import React, { useState, useState } from "react";
import Quiz_timer from "./Quiz_timer";
import questions from "./questions.json";
import { useNavigate } from "react-router-dom";

function Quiz() {
   const navigate = useNavigate();
  const handleResults = () => {
    navigate("/result", {state: {score}}); //sending score along with navigation
  };
  const [currentIndex, setCurrentIndex] = useState(0); // Choose any index
    const [feedback, setFeedback] = useState("");
    const [clicked, setClicked] = useState(false); // To disable after 1 click
    const [optionSelected, setOptionSelected] = useState(false);
    const [ourOptions, setOurOptions] = useState([]);
    const currentItem = questions[currentIndex];

      const [score, setScore] = useState(0); //score tracker
  const [timeUp, setTimeUp] = useState(false);


  useEffect(()=>{
    if(timeUp){
      handleResults();
    }
  }, [timeUp])


    // Shuffle options once
    function shuffleArray(array) {
        const copied = [...array];
        for (let i = copied.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copied[i], copied[j]] = [copied[j], copied[i]];
        }
        return copied;
    }

    useEffect(() => {
        const currentItem = questions[currentIndex];
        const shuffled = shuffleArray(currentItem.options);
        setOurOptions(shuffled);
        setClicked(false); 
        setOptionSelected(false);
        setFeedback('');
    }, [currentIndex]);


  function answerCheck(option) {
    if (option === currentItem.answer) {
      setFeedback("Wow! You are correct");
      setScore(prev=>prev+1); //added the score updating part
    } else {
      setFeedback(`Oops! Correct answer is ${currentItem.answer}`);
    }
  
   if (clicked) return; // Prevent further clicking
        setClicked(true);
        setOptionSelected(true); // Mark that an option was selected
    }
    function handleNext() {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setClicked(false);         // Unlock option
            setFeedback("");           // Clear feedback
        } else {
            navigate("/result");
        }
    }

  return (
    <div className="container">
      <div className="question-card">
        <Quiz_timer setTimeUp = {setTimeUp}/>

                <h2 className="question-title">{currentItem.question}</h2>
                <p className="topic">{currentItem.topic}</p>
                <hr className="underline" />

                <div className="option-container">
                     <div className="options">
                        {ourOptions.map((option, index) => (
                            <h3
                                key={index}
                                className={`option1 ${clicked ? "disabled" : ""}`}
                                onClick={() => answerCheck(option)}
                            >
                                {option}
                            </h3>
                        ))}
                    </div>

                    <h3 className="feedback">{feedback}</h3>
                   <h3
    className={`next ${optionSelected ? "active" : "disabled"}`}
    onClick={() => {
        if (!optionSelected) return; // Prevent clicking if not selected

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
