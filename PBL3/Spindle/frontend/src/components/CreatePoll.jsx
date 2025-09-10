// import React,{useState} from 'react'

// function CreatePoll() {
//   const [question,setQuestion] = useState("")
//   const [options,setOptions] = useState([])
  
//   return (
//     <div>
//        {/* Form Section */}
//        <div className="flex justify-center items-center flex-1 px-4">
//         <div className="w-full max-w-lg bg-white p-8">

//           <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
//             Create a New Poll
//           </h2>

//           <p className="text-center text-gray-600 mb-6">
//             Quickly gather opinions and make group decisions.
//           </p>

//           <form  className="space-y-6">
//             {/* Question */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Your Question
//               </label>
//               <input
//                 type="text"
//                 placeholder="e.g., Where should we go for lunch?"
//                 value={question}
//                 onChange={(e) => setQuestion(e.target.value)}
//                 required
//                 className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-400 focus:outline-none"
//               />
//             </div>

//             {/* Options */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Answer Options
//               </label>

//               {options.map((option, index) => (
//                 <div key={index} className="flex items-center gap-2 mb-2">
//                   <input
//                     type="text"
//                     placeholder={`Option ${index + 1}`}
//                     value={option}
//                     onChange={(e) => handleOptionChange(index, e.target.value)}
//                     required
//                     className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-400 focus:outline-none"
//                   />
//                   {options.length > 2 && (
//                     <button
//                       type="button"
//                       onClick={() => removeOption(index)}
//                       className="text-gray-500 hover:text-red-500"
//                     >
//                       ✕
//                     </button>
//                   )}
//                 </div>
//               ))}


//               <button
//                 type="button"
//                 onClick={addOption}
//                 className="text-red-500 text-sm font-medium hover:underline"
//               >
//                 + Add another option
//               </button>


//             </div>

//             {/* Timer */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Timer (Optional)
//               </label>
//               <select
//                 // value={timer}
//                 // onChange={(e) => setTimer(e.target.value)}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-400 focus:outline-none"
//               >
//                 <option>No timer</option>
//                 <option>5 minutes</option>
//                 <option>30 minutes</option>
//                 <option>1 hour</option>
//                 <option>24 hours</option>
//               </select>
//             </div>



//             {/* Submit */}
//             <button
//               type="submit"
//               className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-full shadow-md transition-transform transform hover:scale-105"
//             >
//               Create Poll
//             </button>
//           </form>
//         </div>
//       </div>

//     </div>
//   )
// }

// export default CreatePoll

// import React from "react";

// function CreatePoll() {
//   return (
//     <>
//       <div>

//         <section className="bg-white">

//           <div className="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">

//             <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-center text-black-900">
//               Create a New Poll
//             </h2>

//             <p className="mb-8 lg:mb-16 font-light text-center text-gray-500 dark:text-gray-400 sm:text-xl">
//               make chaotic group decisions fast
//             </p>



//             <form action="#" className="space-y-8">
//               <div>
//                 <label
//                   for="email"
//                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
//                 >
//                   Your question
//                 </label>
//                 <input
//                   type="email"
//                   id="email"
//                   className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-3xl focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light"
//                   placeholder="eg. Where we should go to celebrate a birthday party?"
//                   required
//                 />
//               </div>
//               <div>
//                 <label
//                   for="subject"
//                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
//                 >
//                   Options
//                 </label>
//                 <input
//                   type="text"
//                   id="subject"
//                   className="block p-3 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light"
//                   placeholder="Let us know how we can help you"
//                   required
//                 />
//               </div>
             
//               <button
//                 type="submit"
//                 className="py-3 px-5 text-sm font-medium text-center text-white rounded-3xl bg-primary-700 sm:w-fit hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-red-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
//               >
//                 create poll
//               </button>
//             </form>
//           </div>
//         </section>
//       </div>
//     </>
//   );
// }

// export default CreatePoll;


















import React, {useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid"; // npm install @heroicons/react
import axios from "axios"

function CreatePoll() {
  const [options, setOptions] = useState(["", ""]); // start with 2 options

  const [timer,setTimer] = useState("")

  const[titleText,setTitleText] = useState("")


  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };



  const handleSubmit = async(e) => {
    e.preventDefault();


    try {
      let obj={
        question:titleText,
        options,
        timer
      }
  
      const response = await axios.post('http://localhost:5000/api/createPoll',obj)
      console.log("poll created",response.data)

      setTitleText("")
      setOptions(["", ""])
      setTimer("")
      alert("Poll created!");

      
    } catch (error) {
      console.log(error)
      
    }

   



  };

  return (
    <section className="bg-white">
      <div className="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
        <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-center text-black-900">
          Create a New Poll
        </h2>

        <p className="mb-8 lg:mb-16 font-light text-center text-gray-500 sm:text-xl">
          make chaotic group decisions fast
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Question */}
          <div>
            <label
              htmlFor="question"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Your question
            </label>
            <input
              type="text"
              id="question"
              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="e.g. Where should we go for a birthday party?"
              required
              value={titleText}
              onChange={(e)=> setTitleText(e.target.value)}
              
            />
          </div>

          {/* Options */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Options
            </label>

            <div className="space-y-3">
              {options.map((opt, index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) =>
                      handleOptionChange(index, e.target.value)
                    }
                    className="block w-full p-3 pr-10 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {/* ❌ remove button */}
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-red-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add option button */}
            <button
              type="button"
              onClick={addOption}
              className="mt-3 px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
            >
              ➕ Add option
            </button>
          </div>


             {/* Question */}
             <div>
            <label
              htmlFor="timer"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Poll Timer
            </label>
            <select
              id="timer"
              value={timer}
              onChange={(e) => setTimer(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5"
            >
              <option value="no-timer">No timer</option>
              <option value="5m">5 minutes</option>
              <option value="15m">15 minutes</option>
              <option value="30m">30 minutes</option>
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
            </select>
          </div>


           

          {/* Submit button */}
          <button
            type="submit"
            className="py-3 px-6 text-sm font-medium text-center text-white rounded-full bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300"
          >
            Create Poll
          </button>
        </form>
      </div>
    </section>
  );
}

export default CreatePoll;
