import React, { useEffect, useState } from "react";
import API from "../services/api";
import PollCard from "../components/PollCard";

function AllPolls() {
  const [polls, setPolls] = useState([]);
  const [displayedPolls, setDisplayedPolls] = useState([]);
  const [filterUsername, setFilterUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);

  // Fetch all polls on mount
  useEffect(() => {
    const fetchPolls = async () => {
      setLoading(true);
      try {
        const res = await API.get("/allpolls");
        const sortedPolls = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setPolls(sortedPolls);
        setDisplayedPolls(sortedPolls);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  // Filter polls
  const handleFilter = () => {
    if (!filterUsername.trim()) return;

    setFiltering(true);
    const filtered = polls.filter(
      (poll) =>
        poll.user &&
        poll.user.username.toLowerCase().includes(filterUsername.toLowerCase())
    );
    setDisplayedPolls(filtered);
    setFiltering(false);
  };

  // Clear filter
  const handleClear = () => {
    setFilterUsername("");
    setDisplayedPolls(polls);
  };

  // Skeleton card
  const SkeletonCard = () => (
    <div className="animate-pulse bg-white rounded-lg p-4 shadow-md">
      <div className="h-6 bg-gray-300 rounded w-1/2 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="mt-3 h-8 bg-gray-300 rounded w-24"></div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      {/* Header + Filter */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-red-500">All Polls</h1>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Filter by username"
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            className="px-3 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={handleFilter}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition"
          >
            Filter
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-2 rounded-lg transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Filter notification */}
      {filterUsername && displayedPolls.length > 0 && (
        <p className="text-sm text-gray-700 mb-2">
          Polls created by{" "}
          <span className="font-semibold">"{filterUsername}"</span>
        </p>
      )}

      {/* Loading / Filtering / Polls */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtering ? (
        <p className="text-gray-500">Filtering...</p>
      ) : (
        <div className="space-y-4">
          {displayedPolls.length > 0 ? (
            displayedPolls.map((poll) => <PollCard key={poll._id} poll={poll} />)
          ) : (
            <p className="text-gray-500">No polls found for this username.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AllPolls;
