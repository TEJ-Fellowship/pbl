import React, { useState, useEffect } from "react";
import {Link} from "react-router-dom";
import axios from "axios";
function MyPolls() {
  const [myPolls, setMyPolls] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/createPoll")
      .then((res) => setMyPolls(res.data))
      .catch((err) => console.log(err));
  }, []);

  // return (
  //   <>
  //     <div>
  //       <h1 className="text-4xl font-semibold text-center text-gray-900 mb-8">
  //         My Polls
  //       </h1>

  //       {myPolls.length === 0 ? (
  //         <p>you haven't created any polls yet</p>
  //       ) : (
  //         <ul>
  //           {myPolls.map((poll) => (
  //             <li key={poll.id}>{poll.question}</li>
  //           ))}
  //         </ul>
  //       )}
  //     </div>
  //   </>
  // );


  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Polls</h1>

      {myPolls.length === 0 ? (
        <p className="text-gray-500">You haven’t created any polls yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myPolls.map((poll) => (
            <div
              key={poll._id || poll.id}
              className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition"
            >
              {/* Poll Title */}
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {poll.question}
              </h2>

              {/* View Results Link */}
              <Link
                to={`../polls/${poll._id || poll.id}/results`}
                className="text-indigo-600 font-medium hover:underline"
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
