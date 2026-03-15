import { useState } from "react";

export default function MonthPicker() {
  const [month, setMonth] = useState("");

  return (
    <div>
      <input
        type="month"
        id="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="w-full bg-slate-700 text-white rounded-full px-6 py-3 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all"
      />
    </div>
  );
}
