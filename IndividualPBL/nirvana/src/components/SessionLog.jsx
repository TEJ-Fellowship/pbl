import React, { useEffect, useContext } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import Streak from "./Streak";
import { ThemeContext } from "../ThemeContext";

function SessionLog({ session, totalTime, streak, setStreak }) {
  const { isDark } = useContext(ThemeContext);

  useEffect(() => {
    async function fetchSessions() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, "sessions"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const dateSet = new Set();
      querySnapshot.forEach((doc) => {
        dateSet.add(doc.data().date);
      });
      const dates = Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a));
      let currentStreak = 0;
      let today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const streakDate = new Date(today);
        streakDate.setDate(today.getDate() - i);
        const streakDateStr = streakDate.toISOString().split("T")[0];
        if (dates.includes(streakDateStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
      setStreak(currentStreak);
    }
    fetchSessions();
  }, []);

  return (
    <div>
      <Streak streak={streak} />
      <div className="flex justify-center mt-6">
        <div
          className={`w-[86%] h-[360px] rounded-2xl pt-6 mb-6 pb-6 flex flex-col items-center justify-center space-y-4 shadow-lg transition-colors duration-300 ${
            isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
          }`}
        >
          <h1 className="text-xl font-bold">🗒️ Session Log</h1>

          <div className="flex gap-4 pb-6 pt-3">
            <div
              className={`rounded-lg p-4 flex flex-col items-center justify-center w-80 h-24 transition-colors duration-300 ${
                isDark
                  ? "bg-blue-900 text-blue-100"
                  : "bg-blue-100 text-blue-900"
              }`}
            >
              <h1 className="font-bold text-lg">{session}</h1>
              <p className="text-center">Total Session</p>
            </div>

            <div
              className={`rounded-lg p-4 flex flex-col items-center justify-center w-80 h-24 transition-colors duration-300 ${
                isDark
                  ? "bg-blue-900 text-blue-100"
                  : "bg-blue-100 text-blue-900"
              }`}
            >
              <h1 className="font-bold text-lg">{Math.floor(totalTime / 60)}</h1>
              <p className="text-center">Minutes Practiced</p>
            </div>
          </div>

          <img src="/clock.png" alt="clock" className="h-12 w-12" />
          <h1 className="text-lg font-semibold text-center">Your Journey begins here</h1>
          <p
            className={`text-center ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Start cleansing your mind today!
          </p>
        </div>
      </div>
    </div>
  );
}

export default SessionLog;
