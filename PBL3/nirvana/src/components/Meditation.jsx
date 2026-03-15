import { useState, useContext } from "react";
import { ThemeContext } from "../ThemeContext";

function Meditation({ handleCreateSession }) {
  const { isDark } = useContext(ThemeContext);
  const [time, setTime] = useState("00:00:60");
  const [intervalId, setIntervalId] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(60);

  function handleTime(minutesToAdd) {
    setTime((prevTime) => {
      const [h, m, s] = prevTime.split(":").map(Number);
      const totalSeconds = h * 3600 + m * 60 + s;
      const newTotal = totalSeconds + minutesToAdd * 60;
      setElapsedSeconds(newTotal);

      const newH = Math.floor(newTotal / 3600)
        .toString()
        .padStart(2, "0");
      const newM = Math.floor((newTotal % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const newS = (newTotal % 60).toString().padStart(2, "0");

      return `${newH}:${newM}:${newS}`;
    });
  }

  function handleTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    } else {
      const id = setInterval(() => {
        setTime((prevTime) => {
          const [h, m, s] = prevTime.split(":").map(Number);
          let totalSeconds = h * 3600 + m * 60 + s;

          if (totalSeconds <= 0) {
            handleCreateSession(elapsedSeconds);
            setElapsedSeconds(0);
            clearInterval(id);
            setIntervalId(null);
            return "00:00:00";
          }
          totalSeconds -= 1;
          const newH = Math.floor(totalSeconds / 3600)
            .toString()
            .padStart(2, "0");
          const newM = Math.floor((totalSeconds % 3600) / 60)
            .toString()
            .padStart(2, "0");
          const newS = (totalSeconds % 60).toString().padStart(2, "0");

          return `${newH}:${newM}:${newS}`;
        });
      }, 1000);

      setIntervalId(id);
    }
  }

  return (
    <div
      className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-[#FFF4F3] text-gray-900"
      }`}
    >
      <div
        className={`w-[750px] max-w-3xl rounded-[40px] p-6 shadow-lg text-center transition-colors duration-300 ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h1 className="font-bold text-2xl mb-2 mt-5">Start Meditating</h1>
        <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Free your mind from pain, one breath at a time
        </p>
        <p className="mt-5">Choose your session duration:</p>

        {/* Duration buttons */}
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {[5, 10, 15, 30].map((min, idx) => (
            <button
              key={idx}
              onClick={() => handleTime(min)}
              className={`px-4 py-2 rounded-3xl transition-colors duration-200 ${
                isDark
                  ? "bg-blue-900 text-blue-100 hover:bg-blue-800"
                  : "bg-blue-50 text-blue-800 hover:bg-blue-100"
              }`}
            >
              +{min}Min
            </button>
          ))}
          <button
            onClick={() => setTime("00:00:00")}
            className={`px-4 py-2 rounded-3xl transition-colors duration-200 ${
              isDark
                ? "bg-red-900 text-red-100 hover:bg-red-800"
                : "bg-red-50 text-red-800 hover:bg-red-100"
            }`}
          >
            Reset
          </button>
        </div>

        {/* Timer */}
        <div
          className={`justify-center items-center ml-[280px] mt-8 mb-8 text-center py-4 rounded-full h-40 w-40 text-xl font-bold transition-colors duration-300 ${
            isDark ? "bg-blue-700 text-white" : "bg-blue-400 text-white"
          }`}
        >
          <h1 className="font-bold text-3xl p-6 mt-5">{time}</h1>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-12 mt-4 mb-6">
          <button
            onClick={handleTimer}
            className={`px-6 py-2 rounded-2xl shadow-md transition-colors duration-200 ${
              isDark
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {intervalId ? "Pause ⏸️" : "▶️ Start Session"}
          </button>

          <button
            className={`px-6 py-2 rounded-2xl shadow-md transition-colors duration-200 ${
              isDark
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : "bg-white text-gray-700 hover:bg-gray-200"
            }`}
          >
            Select Music
          </button>
        </div>
      </div>
    </div>
  );
}

export default Meditation;
