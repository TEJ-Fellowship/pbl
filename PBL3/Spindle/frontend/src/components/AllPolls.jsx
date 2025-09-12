import React, { useEffect, useState } from "react";
import API from "../services/api";
import PollCard from "../components/PollCard";

function AllPolls() {
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await API.get("/allpolls");
        setPolls(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPolls();
  }, []);

  return (
    <div className="min-h-screen text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-red-500">🔥 All Polls</h1>
      <div className="space-y-4">
        {polls.map(poll => (
          <PollCard key={poll._id} poll={poll} />
        ))}
      </div>
    </div>
  );
}

export default AllPolls;
