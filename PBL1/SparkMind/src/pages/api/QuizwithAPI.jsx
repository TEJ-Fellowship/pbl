// import "./Quiz.css";
// import React, { useState, useEffect } from "react";
// import Quiz_timer from "./Quiz_timer";
// import { useNavigate } from "react-router-dom";

// function Quiz() {
//   const navigate = useNavigate();
//   const handleResults = () => {
//     const endTime = Date.now();
//     const duration = Math.floor((endTime - startTime) / 1000);
//     navigate("/result", { state: { score, duration } }); //sending score along with navigation
//   };
//   const [error, setError] = useState(null);
//   const [questions, setQuestions] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0); // Choose any index
//   const [feedback, setFeedback] = useState("");
//   const [clicked, setClicked] = useState(false);
//   const [optionSelected, setOptionSelected] = useState(false);
//   const [ourOptions, setOurOptions] = useState([]);
//   const [isCorrect, setIsCorrect] = useState(null);
//   const [selectedOption, setSelectedOption] = useState(null);
//   const [score, setScore] = useState(0);
//   const [timeUp, setTimeUp] = useState(false);
//   const [startTime, setStartTime] = useState(Date.now());

//   const fetchData = async () => {
//     const res = await fetch(
//       "https://opentdb.com/api.php?amount=5&type=multiple"
//     );
//     const data = await res.json();
//     const formatted = data.results.map((item, index) => {
//       const allOptions = shuffleArray([
//         ...item.incorrect_answers,
//         item.correct_answer,
//       ]);
//       return {
//         id: index + 1,
//         topic: decodeHTML(item.category),
//         question: decodeHTML(item.question),
//         options: allOptions.map(decodeHTML),
//         answer: decodeHTML(item.correct_answer),
//       };
//     });
//     setQuestions(formatted);
//   };
//   useEffect(() => {
//     fetchData();
//   }, []);

//   useEffect(() => {
//     if (timeUp) {
//       handleResults();
//     }
//   }, [timeUp]);

//   useEffect(() => {
//     if (questions.length > 0) {
//       const currentItem = questions[currentIndex];
//       const shuffled = shuffleArray(currentItem.options);
//       setOurOptions(shuffled);
//       setClicked(false);
//       setOptionSelected(false);
//       setFeedback("");
//     }
//   }, [currentIndex, questions]);

//   const decodeHTML = (html) => {
//     const txt = document.createElement("textarea");
//     txt.innerHTML = html;
//     return txt.value;
//   };

//   const shuffleArray = (array) => {
//     const copied = [...array];
//     for (let i = copied.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [copied[i], copied[j]] = [copied[j], copied[i]];
//     }
//     return copied;
//   };

//   const answerCheck = (option) => {
//     if (clicked) return;
//     setClicked(true);
//     setSelectedOption(option);
//     setOptionSelected(true);

//     if (option === questions[currentIndex].answer) {
//       setFeedback("Wow! You are correct");
//       setIsCorrect(true);
//       setScore((prev) => prev + 1);
//     } else {
//       setFeedback(`Oops! Correct answer is ${questions[currentIndex].answer}`);
//       setIsCorrect(false);
//     }
//   };

//   const handleNext = () => {
//     if (currentIndex < questions.length - 1) {
//       setCurrentIndex(currentIndex + 1);
//       setClicked(false);
//       setFeedback("");
//     } else {
//       handleResults();
//     }
//   };

//   if (questions.length === 0) {
//     return (<p> Loading...</p>), (<div className="loader"></div>);
//   }

//   const currentItem = questions[currentIndex];

//   return (
//     <div className="container">
//       {error && (
//         <div style={{ color: "red", textAlign: "center", marginTop: "20px" }}>
//           {error}
//         </div>
//       )}
//       <div className="question-card">
//         <Quiz_timer setTimeUp={setTimeUp} />

//         <h2 className="question-title">{currentItem.question}</h2>
//         <p className="topic">{currentItem.topic}</p>
//         <hr className="underline" />

//         <div className="options">
//           {ourOptions.map((option, index) => (
//             <h3
//               key={index}
//               className={`option1 ${clicked ? "disabled" : ""}`}
//               onClick={() => {
//                 answerCheck(option);
//                 setSelectedOption(index);
//               }}
//               style={{
//                 padding: "10px 20px",
//                 border: "1px solid #ccc",
//                 cursor: "pointer",
//                 backgroundColor:
//                   selectedOption === index
//                     ? isCorrect
//                       ? "#21F14F"
//                       : "#FF3131"
//                     : "white",
//                 color: selectedOption === index ? "white" : "black",
//                 borderRadius: "5px",
//               }}
//             >
//               {option}
//             </h3>
//           ))}
//         </div>

//         <div className="quizController">
//           <h3 className={isCorrect ? "correct" : "incorrect"}>{feedback}</h3>
//           <h3
//             className={`next ${optionSelected ? "active" : "disabled"}`}
//             onClick={() => {
//               setSelectedOption(null);
//               if (!optionSelected) return;

//               if (currentIndex === questions.length - 1) {
//                 handleResults();
//               } else {
//                 handleNext();
//               }
//             }}
//           >
//             {currentIndex === questions.length - 1 ? "View Results" : "Next"}
//           </h3>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Quiz;
