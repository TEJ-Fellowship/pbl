import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function PollResult() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/createPoll/${id}`)
      .then((res) => {
        console.log("Poll data:", res.data);
        setPoll(res.data);
      })

      .catch((err) => console.log(err));
  }, [id]);

  return (
    // <div className="max-w-3xl p-4  bg-white border border-gray-200 rounded-lg shadow-sm sm:p-8 ">
    <div className="max-w-3xl p-6 bg-white border border-gray-200 rounded-xl shadow-lg  sm:p-8">
      <div className="p-6">
        {poll ? (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              {poll.question} ?
            </h1>

            <div className="space-y-3">
              {poll.options?.map((op, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center w-100 h-14 p-4 border-2 border-red-400 rounded-full bg-white shadow-md hover:bg-red-50 transition-all"
                >
                  {/* Option text */}
                  <span className="text-gray-800 font-medium">{op.text}</span>

                  {/* Votes badge */}
                  <span className="text-white bg-red-500 px-3 py-1 rounded-full text-sm font-semibold">
                    {op.votes ?? 0} votes
                  </span>
                </div>
              ))}
            </div>

            {/* <div>
            <span>Total votes: {poll.options.reduce((sum,opt)=> sum+opt.votes, 0)}</span>
           </div> */}

            <div className="pl-4 mt-4 flex justify-between">
              <span>
                Total votes:{" "}
                {poll.options.reduce((sum, opt) => sum + opt.votes, 0)}
              </span>
        

            <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-500 rounded-full  transition-all">
              <span>😄</span>
              <span>Add GIF</span>
            </button>
            </div>

          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}

export default PollResult;

// import React,{useEffect,useState} from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// function PollResult() {
//   const { id } = useParams();
//   const [poll, setPoll] = useState(null);

//   useEffect(() => {
//     axios
//       .get(`http://localhost:5000/api/createPoll/${id}`)
//       .then((res) => {
//         console.log("Poll data:", res.data);
//         setPoll(res.data);
//       })

//       .catch((err) => console.log(err));
//   }, [id]);

//   return (
//     <>
//       <div className="w-full p-4 text-center bg-white border border-gray-200 rounded-lg shadow-sm sm:p-8 dark:bg-gray-800 dark:border-gray-700">

//         <div className="space-y-3">
//           {poll.options?.map((op, idx) => (
//             <div
//               key={idx}
//               className="flex justify-between items-center w-80 h-14 p-4 border-2 border-red-400 rounded-lg bg-white shadow-md hover:bg-red-50 transition-all"
//             >
//               {/* Option text */}
//               <span className="text-gray-800 font-medium">{op.text}</span>

//               {/* Votes badge */}
//               <span className="text-white bg-red-500 px-3 py-1 rounded-full text-sm font-semibold">
//                 {op.votes ?? 0} votes
//               </span>
//             </div>
//           ))}
//         </div>

//         </>

//         ) : (
//    <p>Loading...</p>
//   )}
// </div>

// export default PollResult;
