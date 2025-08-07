// import React from "react";
// import { useState, useEffect } from "react";

// const Quiz_timer = ({ setTimeUp }) => {
//   const [timeLeft, setTimeLeft] = useState(30);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           console.log("Time's Up!");
//           setTimeUp(true);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="timer">
//       <strong>{timeLeft}</strong>
//     </div>
//   );
// };

// export default Quiz_timer;
import React, { useState, useEffect } from "react";

const Quiz_timer = ({ setTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    // 🕒 This sets the timer countdown
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0)); // ✅ Prevents going negative
    }, 1000);
    return () => clearInterval(interval); // ✅ Cleanup when component unmounts
  }, []);

  useEffect(() => {
    // 🧠 Moved setTimeUp(true) here instead of calling it inside the setState
    if (timeLeft === 0) {
      console.log("Time's Up!");
      setTimeUp(true); // ✅ Safe to call state setter now
    }
  }, [timeLeft, setTimeUp]); // 👀 Runs when timeLeft changes

  return (
    <div className="timer">
      <strong>{timeLeft}</strong>
    </div>
  );
};

export default Quiz_timer;
