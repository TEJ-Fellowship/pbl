import React from 'react'
import { Link } from "react-router-dom"

function LandingNavbar() {
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

          <Link to="/login">
            <button
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
                focus:outline-none focus:ring-blue-300 font-medium rounded-lg 
                text-sm px-4 py-2 text-center dark:bg-blue-600 
                dark:hover:bg-blue-700 dark:focus:ring-blue-800 mr-5"
            >
              Login
            </button>
          </Link>



          <Link to="/signUp">
            <button
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
                focus:outline-none focus:ring-blue-300 font-medium rounded-lg 
                text-sm px-4 py-2 text-center dark:bg-blue-600 
                dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Sign Up
            </button>

          </Link>
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

export default LandingNavbar




