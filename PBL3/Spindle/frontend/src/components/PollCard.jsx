import React, { useState } from "react";
import API from "../services/api";

function PollCard({ poll }) {
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [localPoll, setLocalPoll] = useState(poll);
  const castVote = async () => {
    try {
      const res = await API.put(`/allpolls/${localPoll._id}/vote`, { optionId: selected });

      // update local poll with new votes from backend
      setLocalPoll(res.data.poll);

      setMessage(res.data.message || "Vote cast successfully!");
    } catch (error) {
      setMessage(error.response?.data?.error || "Error casting vote");
    }
  };

  return (
    <div className="bg-white text-black p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold">{localPoll.question}</h2>
      <p className="text-sm text-gray-500">
        Created by: {localPoll.createdBy?.username}
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
              disabled={localPoll.hasVoted} 
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
        className="mt-3 bg-red-500 text-white px-4 py-2 rounded"
        disabled={!selected || localPoll.hasVoted}
      >
        {localPoll.hasVoted ? "Already Voted" : "Vote"}
      </button>

      {message && <p className="mt-2">{message}</p>}
    </div>
  );
}

export default PollCard;
