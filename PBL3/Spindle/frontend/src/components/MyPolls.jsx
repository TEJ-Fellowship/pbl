import React, { useState, useEffect } from "react";
import { TrashIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import axios from "axios";

function MyPolls() {
  const [myPolls, setMyPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser?._id) {
          setMyPolls([]);
          setIsLoading(false);
          return;
        }

        const res = await axios.get(
          `http://localhost:5000/api/createPoll?userId=${storedUser._id}`
        );
        setMyPolls(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolls();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this poll?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/createPoll/${id}`);
      setMyPolls((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  // Skeleton Loader (3 fake cards)
  const SkeletonCard = () => (
    <div className="animate-pulse bg-gray-200 rounded-2xl p-5 h-32"></div>
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Polls</h1>

      {isLoading ? (
        // Skeleton Loader while fetching
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : myPolls.length === 0 ? (
        // Show no polls message only after loading is done
        <p className="text-gray-500">You haven’t created any polls yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myPolls.map((poll) => (
            <div
              key={poll._id || poll.id}
              className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition"
            >
              {/* Poll Title + Delete */}
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {poll.question}
                </h2>

                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(poll._id)}
                >
                  <TrashIcon className="h-6 w-6" />
                </button>
              </div>

              {/* View Results Link */}
              <Link
                to={`../polls/${poll._id || poll.id}/results`}
                className="text-red-600 font-medium hover:underline"
              >
                View Results →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyPolls;
