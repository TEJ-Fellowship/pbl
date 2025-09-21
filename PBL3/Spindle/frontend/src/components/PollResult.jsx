// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";

// function PollResult() {
//   const [isOpen, setIsOpen] = useState(false);

//   const { id } = useParams();
//   const [poll, setPoll] = useState(null);

//   const [searchTerm, setSearchTerm] = useState("");

//   //get gif from the api
//   const [gifs, setGifs] = useState([]);

//   const [showSearch, setShowSearch] = useState(false);

//   //fetch user who voted a particular option
//   const [voters, setVoters] = useState([]);
//   const [selectedOption, setSelectedOption] = useState(null);

//   //to render selected gif
//   const [selectedGif, setSelectedGif] = useState([]);

//   const GIF_API_KEY = "HvBBtNhsK0q8Qu8hpojJb5I1Hwz6c298";

//   useEffect(() => {
//     axios
//       .get(`http://localhost:5000/api/createPoll/${id}`)
//       .then((res) => {
//         console.log("Poll data:", res.data);
//         setPoll(res.data);
//       })

//       .catch((err) => console.log(err));
//   }, [id]);

//   //fetch gif from GIPHY APU when searchterm changes
//   useEffect(() => {
//     if (!searchTerm) return;

//     const fetchGifs = async () => {
//       try {
//         const res = await axios.get("https://api.giphy.com/v1/gifs/search", {
//           params: {
//             api_key: GIF_API_KEY,
//             q: searchTerm,
//             limit: 8,
//           },
//         });

//         setGifs(res.data.data);
//       } catch (error) {
//         console.log(error);
//       }
//     };
//     fetchGifs();
//   }, [searchTerm]);

//   if (!poll) return <p>Loading</p>;
//   const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
//   let percentage;

//   const handleGifSelect = (gif) => {
//     console.log("Selected GIF:", gif.images.fixed_height.url);

//     setSelectedGif((prev) => [...prev, gif.images.fixed_height.url]);

//     setShowSearch(false);
//     setSearchTerm("");
//     setGifs([]);
//   };

//   const handleShowVoters = async (optionId) => {
//     try {
//       const res = await axios.get(
//         `http://localhost:5000/api/poll/${id}/option/${optionId}/voters`
//       );
//       console.log("Voters response:", res.data); // debug
//       setVoters(res.data);
//       setSelectedOption(optionId.toString()); // ensure string
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   return (
//     <>
//       <div className="max-w-3xl p-6 bg-white border border-gray-200 rounded-xl shadow-lg  sm:p-8">
//         <div className="p-6">
//           {poll ? (
//             <>
//               <h1 className="text-3xl font-bold text-gray-800 mb-6">
//                 {poll.question} ?
//               </h1>
//               <div className="space-y-3">
//                 {poll.options?.map((op, idx) => {
//                   percentage =
//                     totalVotes > 0
//                       ? Math.round((op.votes / totalVotes) * 100)
//                       : 0;

//                   return (
//                     <div
//                       key={idx}
//                       className=" relative flex items-center w-full h-14 p-4 border-2 border-red-400 rounded-full bg-white shadow-md overflow-hidden"
//                     >
//                       <div
//                         className="absolute top-0 left-0 h-full bg-red-100 transition-all duration-500"
//                         style={{ width: `${percentage}%` }}
//                       ></div>

//                       <div className="relative flex justify-between items-center w-full">
//                         <span className="text-gray-800 font-medium">
//                           {op.text}
//                         </span>

//                         {/* <span
//                           className="text-white bg-red-500 px-3 py-1 rounded-full text-sm font-semibold"
//                           onClick={() => handleShowVoters(op._id)}
//                         >
//                           {op.votes ?? 0} votes ({percentage}%)
//                         </span> */}

//                         <button
//                           className="text-white bg-red-500 px-3 py-1 rounded-full text-sm font-semibold"
//                           onClick={() => {
//                             handleShowVoters(op._id);
//                             setIsOpen(true);
//                           }}
//                         >
//                           {op.votes ?? 0} votes ({percentage}%)
//                         </button>
//                       </div>

//                       {/* Voter list */}
//                       {/* {selectedOption === op._id.toString() &&
//                         voters.length > 0 && (
//                           <div className="mt-2 ml-4 p-2 bg-gray-100 rounded">
//                             <h3 className="font-semibold text-gray-700 mb-1">
//                               Voters:
//                             </h3>
//                             <ul className="list-disc list-inside">
//                               {voters.map((user) => (
//                                 <li key={user._id}>{user.name}</li>
//                               ))}
//                             </ul>
//                           </div>
//                         )} */}

//                       {isOpen && (
//                         <div
//                           tabIndex="-1"
//                           className="fixed inset-0 z-50 flex justify-center items-center w-full h-full overflow-y-auto overflow-x-hidden bg-black/50"
//                         >
//                           <div className="relative p-4 w-full max-w-md max-h-full">
//                             <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
//                               {/* Modal header */}
//                               <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
//                                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//                                   voters:
//                                 </h3>
//                                 <button
//                                   type="button"
//                                   onClick={() => setIsOpen(false)}
//                                   className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
//                                 >
//                                   <svg
//                                     className="w-3 h-3"
//                                     aria-hidden="true"
//                                     xmlns="http://www.w3.org/2000/svg"
//                                     fill="none"
//                                     viewBox="0 0 14 14"
//                                   >
//                                     <path
//                                       stroke="currentColor"
//                                       strokeLinecap="round"
//                                       strokeLinejoin="round"
//                                       strokeWidth="2"
//                                       d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
//                                     />
//                                   </svg>
//                                   <span className="sr-only">Close modal</span>
//                                 </button>
//                               </div>

//                               {/* Modal body */}
//                               <div className="p-4 md:p-5">

//                                 {selectedOption === op._id.toString() &&
//                                   voters.length > 0 && (
//                                     <div className="mt-2 ml-4 p-2 bg-gray-100 rounded">
//                                       <h3 className="font-semibold text-gray-700 mb-1">
//                                         Voters:
//                                       </h3>
//                                       <ul className="list-disc list-inside">
//                                         {voters.map((user) => (
//                                           <li key={user._id}>{user.name}</li>
//                                         ))}
//                                       </ul>
//                                     </div>
//                                   )}
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//               <div className="pl-4 mt-4">
//                 <span>Total votes:{totalVotes}</span>
//               </div>
//               <button
//                 className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-100 text-red-500 rounded-full  transition-all mb-2"
//                 onClick={() => setShowSearch(!showSearch)}
//               >
//                 <span>😄</span>
//                 <span>Add GIF</span>
//               </button>
//               {showSearch && (
//                 <div className="flex flex-col gap-2 mt-2">
//                   {/* <input
//                     type="text"
//                     className="border p-2 rounded"
//                     placeholder="Search GIPHY"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                   /> */}

//                   <input
//                     type="text"
//                     className="w-full max-w-md px-4 py-2 rounded-xl border border-gray-300
//              focus:outline-none focus:ring-2 focus:ring-blue-500
//              focus:border-blue-500 shadow-sm text-gray-700
//              placeholder-gray-400 transition-all duration-200"
//                     placeholder="Search GIPHY"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                   />

//                   <div className="grid grid-cols-4 gap-2 mt-2">
//                     {gifs.map((gif) => (
//                       <img
//                         key={gif.id}
//                         src={gif.images.fixed_height.url}
//                         alt={gif.title}
//                         className="cursor-pointer rounded"
//                         onClick={() => handleGifSelect(gif)}
//                       />
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {selectedGif && (
//                 <div className="mt-6">
//                   <h2 className="font-semibold mb-2">Your gifs:</h2>

//                   <div className="flex flex-wrap gap-2">
//                     {selectedGif.map((url, idx) => (
//                       <img
//                         key={idx}
//                         src={url}
//                         alt="Selected GIF"
//                         className="rounded-md w-40 h-auto"
//                       />
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </>
//           ) : (
//             <p>Loading...</p>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// export default PollResult;

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function PollResult() {
  const [isOpen, setIsOpen] = useState(false);

  const { id } = useParams();
  const [poll, setPoll] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  //get gif from the api
  const [gifs, setGifs] = useState([]);

  const [showSearch, setShowSearch] = useState(false);

  //fetch user who voted a particular option
  const [voters, setVoters] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  //to render selected gif
  const [selectedGif, setSelectedGif] = useState([]);

  const GIF_API_KEY = "HvBBtNhsK0q8Qu8hpojJb5I1Hwz6c298";

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/createPoll/${id}`)
      .then((res) => {
        console.log("Poll data:", res.data);
        setPoll(res.data);
      })

      .catch((err) => console.log(err));
  }, [id]);

  //fetch gif from GIPHY APU when searchterm changes
  useEffect(() => {
    if (!searchTerm) return;

    const fetchGifs = async () => {
      try {
        const res = await axios.get("https://api.giphy.com/v1/gifs/search", {
          params: {
            api_key: GIF_API_KEY,
            q: searchTerm,
            limit: 8,
          },
        });

        setGifs(res.data.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchGifs();
  }, [searchTerm]);

  if (!poll) return <p>Loading</p>;
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
  let percentage;

  const handleGifSelect = (gif) => {
    console.log("Selected GIF:", gif.images.fixed_height.url);

    setSelectedGif((prev) => [...prev, gif.images.fixed_height.url]);

    setShowSearch(false);
    setSearchTerm("");
    setGifs([]);
  };

  // const handleShowVoters = async (optionId) => {
  //   try {
  //     const res = await axios.get(
  //       `http://localhost:5000/api/poll/${id}/option/${optionId}/voters`
  //     );
  //     console.log("Voters response:", res.data); // debug
  //     setVoters(res.data);
  //     setSelectedOption(optionId.toString()); // ensure string
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  const handleShowVoters = async (optionId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/poll/${id}/option/${optionId}/voters`
      );
      setVoters(res.data);
      setSelectedOption(optionId.toString());
      setIsOpen(true); // open modal after fetching voters
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <div className="max-w-3xl p-6 bg-white border border-gray-200 rounded-xl shadow-lg  sm:p-8">
        <div className="p-6">
          {poll ? (
            <>
              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                {poll.question} ?
              </h1>
              <div className="space-y-3">
                {poll.options?.map((op, idx) => {
                  percentage =
                    totalVotes > 0
                      ? Math.round((op.votes / totalVotes) * 100)
                      : 0;

                  return (
                    <div
                      key={idx}
                      className=" relative flex items-center w-full h-14 p-4 border-2 border-red-400 rounded-full bg-white shadow-md overflow-hidden"
                    >
                      <div
                        className="absolute top-0 left-0 h-full bg-red-100 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>

                      <div className="relative flex justify-between items-center w-full">
                        <span className="text-gray-800 font-medium">
                          {op.text}
                        </span>

                        {/* <span
                          className="text-white bg-red-500 px-3 py-1 rounded-full text-sm font-semibold"
                          onClick={() => handleShowVoters(op._id)}
                        >
                          {op.votes ?? 0} votes ({percentage}%)
                        </span> */}

                        <button
                          className="text-white bg-red-500 px-3 py-1 rounded-full text-sm font-semibold"
                          onClick={() => {
                            handleShowVoters(op._id);
                            setIsOpen(true);
                          }}
                        >
                          {op.votes ?? 0} votes ({percentage}%)
                        </button>
                      </div>

                      {/* Voter list */}
                      {/* {selectedOption === op._id.toString() &&
                        voters.length > 0 && (
                          <div className="mt-2 ml-4 p-2 bg-gray-100 rounded">
                            <h3 className="font-semibold text-gray-700 mb-1">
                              Voters:
                            </h3>
                            <ul className="list-disc list-inside">
                              {voters.map((user) => (
                                <li key={user._id}>{user.name}</li>
                              ))}
                            </ul>
                          </div>
                        )} */}

                      {isOpen && selectedOption && (
                        <div className="fixed inset-0 z-50 flex justify-center items-center w-full h-full overflow-y-auto overflow-x-hidden">

                        
                          <div className="relative p-4 w-full max-w-md max-h-full">
                          
                            <div className="relative bg-white rounded-lg shadow-sm dark:bg-white">

                              <div className="flex items-center justify-between p-4 border-b rounded-t">

                                <h3 className="text-lg font-semibold">
                                  Voters
                                </h3>
                                <button onClick={() => setIsOpen(false)}>
                                  Close
                                </button>
                              </div>
                              <div className="p-4">
                                {voters.length === 0 ? (
                                  <p>No voters yet.</p>
                                ) : (
                                  <ul className="list-disc list-inside">
                                    {voters.map((user) => (
                                      <li key={user._id}>{user.username}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="pl-4 mt-4">
                <span>Total votes:{totalVotes}</span>
              </div>
              <button
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-100 text-red-500 rounded-full  transition-all mb-2"
                onClick={() => setShowSearch(!showSearch)}
              >
                <span>😄</span>
                <span>Add GIF</span>
              </button>
              {showSearch && (
                <div className="flex flex-col gap-2 mt-2">
                  {/* <input
                    type="text"
                    className="border p-2 rounded"
                    placeholder="Search GIPHY"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  /> */}

                  <input
                    type="text"
                    className="w-full max-w-md px-4 py-2 rounded-xl border border-gray-300 
             focus:outline-none focus:ring-2 focus:ring-blue-500 
             focus:border-blue-500 shadow-sm text-gray-700 
             placeholder-gray-400 transition-all duration-200"
                    placeholder="Search GIPHY"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {gifs.map((gif) => (
                      <img
                        key={gif.id}
                        src={gif.images.fixed_height.url}
                        alt={gif.title}
                        className="cursor-pointer rounded"
                        onClick={() => handleGifSelect(gif)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedGif && (
                <div className="mt-6">
                  <h2 className="font-semibold mb-2">Your gifs:</h2>

                  <div className="flex flex-wrap gap-2">
                    {selectedGif.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Selected GIF"
                        className="rounded-md w-40 h-auto"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </>
  );
}

export default PollResult;
