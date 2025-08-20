import React,{useState} from "react";


function Navbar({setActiveSection}) {


  return (
    <div>
      <nav className="border-gray-200 bg-gray-50 dark:bg-white-800 dark:border-gray-700">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <a
            href="#"
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-black">
              DevLog
            </span>
          </a>

          <div
            className="hidden w-full md:block md:w-auto"
            id="navbar-solid-bg"
          >
            <ul className="flex flex-col font-medium mt-4 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent dark:bg-gray-800 md:dark:bg-transparent dark:border-gray-700 justify-center items-center">




              <li>
              
                <button
                  className="
    block
    py-2
    px-4
    rounded-md
    bg-blue-700
    text-white
    font-semibold
    hover:bg-blue-800
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
    focus:ring-offset-2
    transition
    md:bg-transparent
    md:text-blue-700
    md:hover:bg-blue-100
    md:hover:text-white
    md:dark:text-blue-500
    dark:bg-blue-600
    md:dark:bg-transparent
    md:dark:hover:bg-blue-700
    md:dark:hover:text-white
  "
                  aria-current="page"
                  onClick={()=> setActiveSection("logs")}
                >
                  logs
                </button>
              </li>
              <li>
                <button
                  className="
    block
    py-2
    px-4
    rounded-md
    bg-blue-700
    text-white
    font-semibold
    hover:bg-blue-800
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
    focus:ring-offset-2
    transition
    md:bg-transparent
    md:text-blue-700
    md:hover:bg-blue-100
    md:hover:text-white
    md:dark:text-blue-500
    dark:bg-blue-600
    md:dark:bg-transparent
    md:dark:hover:bg-blue-700
    md:dark:hover:text-white
  "
                  aria-current="page"

                  onClick={()=> setActiveSection("addLogs")}
                >
                  add logs
                </button>
              </li>
             


              <li>
                <button
                  className="
    block
    py-2
    px-4
    rounded-md
    bg-blue-700
    text-white
    font-semibold
    hover:bg-blue-800
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
    focus:ring-offset-2
    transition
    md:bg-transparent
    md:text-blue-700
    md:hover:bg-blue-100
    md:hover:text-white
    md:dark:text-blue-500
    dark:bg-blue-600
    md:dark:bg-transparent
    md:dark:hover:bg-blue-700
    md:dark:hover:text-white
  "
                  aria-current="page"

                  onClick={()=> setActiveSection("syncGithub")}
                >
                  sync github
                </button>
              </li>




              

            

            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
