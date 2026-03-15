import React, { useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import "./Formpage.css";

function Formpage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [destination, setDestination] = useState("");

  const openStartPicker = () => {
    document.getElementById("startDate").showPicker?.();
  };

  const openEndPicker = () => {
    document.getElementById("endDate").showPicker?.();
  };

  const handleCreateTrip = () => {
    const tripData = {
      destination,
      startDate,
      endDate,
    };

    localStorage.setItem("tripData", JSON.stringify(tripData));

    alert("Trip saved to localStorage!");
    setDestination("");
    setStartDate("");
    setEndDate("");
  };
  

  return (
    <div className="bg-[#17161b] max-w-md mx-auto mt-4 p-6 rounded-lg shadow-md border border-gray-700 ">
      <div className="text-lg font-semibold text-orange-400 mb-4">
        Add New Trip
      </div>

      <div className="mb-2">
        <label className="block text-gray-400 mb-1">Destination</label>
        <textarea
          className="w-full border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-[#262628] text-gray-200 placeholder-gray-500"
          placeholder="Choose Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="text-gray-400 mb-1">Start</div>
          <div className="relative">
            <input
              id="startDate"
              type="date"
              className="w-full border border-gray-700 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-[#262628] text-gray-200"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <FaCalendarAlt
              onClick={openStartPicker}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 cursor-pointer hover:text-orange-500 transition-colors"
              size={18}
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="text-gray-400 mb-1">End</div>
          <div className="relative">
            <input
              id="endDate"
              type="date"
              className="w-full border border-gray-700 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-[#262628] text-gray-200"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <FaCalendarAlt
              onClick={openEndPicker}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 cursor-pointer hover:text-orange-500 transition-colors"
              size={18}
            />
          </div>
        </div>
      </div>

      {startDate && endDate && (
        <p className="text-green-400 font-medium">
          Selected: {startDate} → {endDate}
        </p>
      )}

      <div className="mt-4">
        <button
          onClick={handleCreateTrip}
          className="w-full py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md transition duration-200"
        >
          Create Trip
        </button>
      </div>
    </div>
  );
}

export default Formpage;
