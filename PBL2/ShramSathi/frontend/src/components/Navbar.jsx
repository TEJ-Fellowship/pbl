// import React from "react";

// function Navbar() {
//   return (
//     // <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600 h-16">

//     <nav className="bg-white fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600 h-16">

//       <div className="max-w-screen-xl flex items-center justify-between mx-auto px-4 h-full">
//         {/* Logo */}
//         <a
//           href="/"
//           className="flex items-center space-x-3 rtl:space-x-reverse h-full"
//         >
//           <img
//             src="/images/projectLogo.png"
//             className="h-16 w-auto object-contain"
//             alt="Logo"
//           />
//         </a>

//         {/* Buttons */}
//         <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
//           <button
//             type="button"
//             className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
//             focus:outline-none focus:ring-blue-300 font-medium rounded-lg 
//             text-sm px-4 py-2 text-center dark:bg-blue-600 
//             dark:hover:bg-blue-700 dark:focus:ring-blue-800 mr-5"
//           >
//             Login
//           </button>

//           <button
//             type="button"
//             className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
//             focus:outline-none focus:ring-blue-300 font-medium rounded-lg 
//             text-sm px-4 py-2 text-center dark:bg-blue-600 
//             dark:hover:bg-blue-700 dark:focus:ring-blue-800"
//           >
//             Sign Up
//           </button>
//         </div>

//         {/* Menu Links */}
//         <div
//           className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
//           id="navbar-sticky"
//         >
//           <ul
//             className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 
//             rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row 
//             md:mt-0 md:border-0 md:bg-white
//             dark:border-gray-700"
//           >
//             <li>
//               <a
//                 href="#"
//                 className="block py-2 px-3 bg-blue-700 rounded-sm 
//                 md:bg-transparent md:text-blue-700 md:p-0 md:dark:text-blue-500"
//                 aria-current="page"
//               >
//                 Home
//               </a>
//             </li>
//             <li>
//               <a
//                 href="#"
//                 className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 
//                 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 
//                 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 
//                 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
//               >
//                 About us
//               </a>
//             </li>
//             <li>
//               <a
//                 href="#"
//                 className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 
//                 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 
//                 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 
//                 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
//               >
//                 Contact
//               </a>
//             </li>
//           </ul>
//         </div>
//       </div>
//     </nav>
//   );
// }

// export default Navbar;



import React from "react";

function Navbar() {
  return (
    <nav className="bg-white  fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600 h-20">
      <div className="max-w-screen-xl flex items-center justify-between mx-auto px-4 h-full">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center space-x-3 rtl:space-x-reverse h-full"
        >
          <img
            src="/images/projectLogo.png"
            className="h-20 w-auto object-contain"
            alt="Logo"
          />
        </a>

        {/* Buttons */}
        <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <button
            type="button"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
            focus:outline-none focus:ring-blue-300 font-medium rounded-lg 
            text-sm px-4 py-2 text-center dark:bg-blue-600 
            dark:hover:bg-blue-700 dark:focus:ring-blue-800 mr-5"
          >
            Login
          </button>

          <button
            type="button"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
            focus:outline-none focus:ring-blue-300 font-medium rounded-lg 
            text-sm px-4 py-2 text-center dark:bg-blue-600 
            dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Sign Up
          </button>
        </div>

        {/* Menu Links */}
        <div
          className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
          id="navbar-sticky"
        >
          <ul
            className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 
            rounded-lg  md:space-x-8 rtl:space-x-reverse md:flex-row 
            md:mt-0 md:border-0  
            "
          >
            <li>
              <a
                href="#"
                className="block py-2 px-3 text-black rounded-sm 
                md:bg-transparent  md:p-0"
                aria-current="page"
              >
                Home
              </a>
            </li>

            


            <li>
              <a
                href="#"
                className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 
                md:hover:bg-transparent md:p-0 
                md:dark:hover:text-blue-500 md:dark:hover:bg-transparent "
              >
                About us
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 
                md:hover:bg-transparent md:p-0 
                md:dark:hover:text-blue-500 md:dark:hover:bg-transparent "
              >
                Contact
              </a>
            </li>


    
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
