// import React, { useEffect, useState } from "react";
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
//     // <div className="max-w-3xl p-4  bg-white border border-gray-200 rounded-lg shadow-sm sm:p-8 ">
//     <div className="max-w-3xl p-6 bg-white border border-gray-200 rounded-xl shadow-lg  sm:p-8">
//       <div className="p-6">
//         {poll ? (
//           <>
//             <h1 className="text-3xl font-bold text-gray-800 mb-6">
//               {poll.question} ?
//             </h1>

//             <div className="space-y-3">
//               {poll.options?.map((op, idx) => (
//                 <div
//                   key={idx}
//                   className="flex justify-between items-center w-100 h-14 p-4 border-2 border-red-400 rounded-full bg-white shadow-md hover:bg-red-50 transition-all"
//                 >
//                   {/* Option text */}
//                   <span className="text-gray-800 font-medium">{op.text}</span>

//                   {/* Votes badge */}
//                   <span className="text-white bg-red-500 px-3 py-1 rounded-full text-sm font-semibold">
//                     {op.votes ?? 0} votes
//                   </span>
//                 </div>
//               ))}
//             </div>

//             {/* <div>
//             <span>Total votes: {poll.options.reduce((sum,opt)=> sum+opt.votes, 0)}</span>
//            </div> */}

//             <div className="pl-4 mt-4 flex justify-between">
//               <span>
//                 Total votes:{" "}
//                 {poll.options.reduce((sum, opt) => sum + opt.votes, 0)}
//               </span>
        

//             <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-500 rounded-full  transition-all">
//               <span>😄</span>
//               <span>Add GIF</span>
//             </button>
//             </div>

//           </>
//         ) : (
//           <p>Loading...</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default PollResult;
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function PollResult() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  //get gif from the api
  const [gifs, setGifs] = useState([]);

  const [showSearch, setShowSearch] = useState(false);

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

    setSelectedGif((prev) => [...prev,gif.images.fixed_height.url ]);

    setShowSearch(false);
    setSearchTerm("");
    setGifs([]);
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
                        <span className="text-white bg-red-500 px-3 py-1 rounded-full text-sm font-semibold">
                          {op.votes ?? 0} votes ({percentage}%)
                        </span>
                      </div>
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
                {selectedGif.map((url,idx)=>(
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
