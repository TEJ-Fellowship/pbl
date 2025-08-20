import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const Themetoggle = () => {
  const [mode, setMode] = useState(false);

  const toggledark = () => {
    setMode(!mode);
  };

  useEffect(() => {
    if (mode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  return (
    <>
      <button
        onClick={toggledark}
        className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {mode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
    </>
  );
};

export default Themetoggle;
