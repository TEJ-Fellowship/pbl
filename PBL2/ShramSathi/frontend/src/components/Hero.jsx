// import React from 'react'

// function Hero() {
//   return (
//     <section className="bg-gray-50 dark:bg-gray-900 py-24">
//       <div className="max-w-4xl mx-auto text-center px-4">
//         <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
//           Don’t just volunteer! <br/>volunteer smartly with <span className="text-blue-700">ShramSathi</span>.
//         </h1>
//         <p className="mt-6 text-lg text-gray-700 dark:text-gray-300">
//           Join community programs, track your tasks, and make a real impact in your community.
//         </p>
//       </div>

//         {/* Get Started Button */}
//         <div className="mt-8 flex justify-center">
//           <button

//             className="bg-blue-700 hover:bg-blue-800 text-white font-medium
//                        px-6 py-3 rounded-lg text-lg transition-colors duration-300"
//           >
//             Get Started
//           </button>
//         </div>

//     </section>

//   )
// }

// export default Hero

import React from "react";
import dog from "/images/dog.jpg";

function Hero({setShowDashboard}) {
  return (

    <div>
      <section
        className="bg-white mt-20
      bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${dog})` }}
      >
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Don’t just volunteer! <br />
            volunteer smartly with{" "}
            <span className="text-blue-700">ShramSathi</span>.
          </h1>

          <p className="mt-6 text-lg text-white">
            Join community programs, track your tasks, and make a real impact in
            your community.
          </p>

          <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <a
              href="#"
              className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-gray-900 rounded-lg border border-gray-300 
              bg-blue-700
              
              hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-blue-700 dark:hover:bg-blue-700

            

               dark:focus:ring-gray-800 mt-5"

               onClick={()=>setShowDashboard(true) }
            >
              GET STARTED
            </a>
          </div>
        </div>
      </section>


      <div className="mt-12 flex  justify-center gap-8  text-left ">

        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-300">
          <h3 className="text-xl font-semibold mb-2">Easy Task Tracking</h3>
          <p className="text-gray-600">
            Organize all your tasks and track your progress efficiently.
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-300">
          <h3 className="text-xl font-semibold mb-2">Community Programs</h3>
          <p className="text-gray-600">
            Participate in local initiatives and make a real impact.
          </p>
        </div>


        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-300">
          <h3 className="text-xl font-semibold mb-2">Organize tasks by day or category
</h3>
          <p className="text-gray-600">
          Plan your activities efficiently by sorting tasks by day or by category, making it easier to focus on what matters most.

          </p>
        </div>





      </div>
    </div>
  );
}

export default Hero;
