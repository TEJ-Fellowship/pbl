import React, { useState, useEffect } from "react";
import API from "../services/api";

function PollCard({ poll }) {
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [localPoll, setLocalPoll] = useState(poll);
  const [creator, setCreator] = useState(null);
  const [timeLeft, setTimeLeft] = useState(""); // countdown
  const [isClosed, setIsClosed] = useState(false); // open/closed state

  // Function to update countdown
  const calculateTimeLeft = () => {
    if (!localPoll.expiresAt) {
      setTimeLeft("No time Limit");
      setIsClosed(false); // never expires
      return;
    }

    const end = new Date(localPoll.expiresAt).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) {
      setTimeLeft("Expired");
      setIsClosed(true);
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
      setIsClosed(false);
    }
  };

  // Run countdown every second
  useEffect(() => {
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [localPoll.expiresAt]);

  // Fetch creator's username
  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!localPoll.user || !token) return;

        const res = await API.get(`/users/${localPoll.user}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCreator(res.data);
      } catch (err) {
        console.error("Error fetching creator:", err);
      }
    };
    fetchCreator();
  }, [localPoll.user]);

  const castVote = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.put(
        `/allpolls/${localPoll._id}/vote`,
        { optionId: selected },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update poll and set hasVoted immediately
      setLocalPoll({
        ...res.data.poll,
        hasVoted: true,
      });

      setMessage(res.data.message || "Vote cast successfully!");
    } catch (error) {
      setMessage(error.response?.data?.error || "Error casting vote");
    }
  };


  return (
    <div className="relative bg-white text-black p-4 rounded-lg shadow-md mb-4">
      {/* Timer + Status top right */}
      <div className="absolute top-2 right-2 flex items-center space-x-2 text-xs">
        <span className="px-2 py-1 rounded bg-gray-700 text-white">
          {timeLeft}
        </span>
        <span
          className={`px-2 py-1 rounded font-bold ${isClosed ? "bg-red-500 opacity-80 text-white" : "bg-green-500 opacity-80 text-white"
            }`}
        >
          {isClosed ? "Closed" : "Open"}
        </span>
        <span
          className={`px-2 py-1 rounded font-semibold text-xs ${localPoll.hasVoted
            ? "bg-green-200 opacity-80 text-green-800"
            : "bg-gray-200 opacity-80 text-gray-700"
            }`}
        >
          {localPoll.hasVoted ? "You Voted" : "Not Voted"}
        </span>
      </div>

      {/* Poll content */}
      <h2 className="text-xl font-bold">{localPoll.question}</h2>
      <p className="text-sm text-gray-500 opacity-60">
        Created by: {localPoll.user ? localPoll.user.username : "unknown"}
      </p>


      <div className="mt-3 space-y-2">
        {localPoll.options.map((opt) => (
          <label key={opt._id} className="block">
            <input
              type="radio"
              name={localPoll._id}
              value={opt._id}
              checked={selected === opt._id}
              onChange={(e) => setSelected(e.target.value)}
              disabled={localPoll.hasVoted || isClosed}
            />
            {opt.text}
            <span className="ml-2 text-gray-500 text-sm">
              ({opt.votes} votes)
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={castVote}
        className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        disabled={!selected || localPoll.hasVoted || isClosed}
      >
        {isClosed
          ? "Closed"
          : localPoll.hasVoted
            ? "Already Voted"
            : "Vote"}
      </button>

      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>

  );
}

export default PollCard;
