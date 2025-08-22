import React from "react";
import { useState } from "react";
// import { useContext } from "react";
// import { AuthContext } from "../AuthContext";
// import { ThemeContext } from "../ThemeContext";
function Navbar() {
  // let isLoggedIn=false;
  let isDark=false;
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  // const [isDark,setIsDark] = useState(false)
  // const { isLoggedIn, logout } = useContext(AuthContext);
  // const { isDark, handleToggle } = useContext(ThemeContext);
  return (
    <div>
      <nav
        className={`sticky top-0 z-50 w-full  shadow-lg after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10 ${
          isDark ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <a href="/">
                <img
                  src="/logo.png"
                  alt="Your Company"
                  className="h-[128px] w-[160px]"
                />
              </a>
            </div>
            {isLoggedIn ? (
              <div
                className={`flex items-center  space-x-6 ${
                  isDark ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                <div className="hidden text-md sm:flex mr-16 space-x-4">
                  <a
                    href="#"
                    className={`rounded-md px-3 py-2  font-medium ${
                      isDark
                        ? "text-white hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Quotes
                  </a>
                  <a
                    href="#"
                    className={`rounded-md px-3 py-2  font-medium ${
                      isDark
                        ? "text-white hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                  Home
                  </a>
                  <a
                    href="#"
                    className={`rounded-md px-3 py-2  font-medium ${
                      isDark
                        ? "text-white hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                   About
                  </a>
                  <a
                    href="#"
                    className={`rounded-md px-3 py-2  font-medium ${
                      isDark
                        ? "text-white hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                   Journals
                  </a>
                </div>


                <div className="flex items-center space-x-1">
                  <img
                  // onclick = {setIsDark(!isDark)}
                    src={isDark ? "/streakdark.png" : "/sun.png"}
                    alt="theme"
                 
                    className="h-8 w-8 transform -rotate-6 hover:cursor-pointer"
                  />
                </div>

                <button className="relative flex rounded-full focus:outline-none">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Profile"
                    className="h-8 w-8 rounded-full"
                  />
                </button>
                <button onClick={()=>{
                  setIsLoggedIn(!isLoggedIn)
                }}
              
                  className={`rounded-md px-3 py-2 text-md font-medium ${
                    isDark
                      ? "text-white hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center  space-x-6">
                <div className="hidden sm:flex space-x-4">
                  <a
                    href="/login"
                    className={`rounded-md px-3 py-2 text-md font-medium ${
                      isDark
                        ? "text-white hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Login
                  </a>
                  <a
                    href="/signup"
                    className={`rounded-md px-3 py-2 text-md font-medium ${
                      isDark
                        ? "text-white hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    SignUp
                  </a>
                     <div className="flex items-center space-x-1">
                  <img                   
                    src={isDark ? "/streakdark.png" : "/sun.png"}
                    alt="theme"
                    className="h-8 w-8 transform -rotate-6 hover:cursor-pointer"
                  />
                </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
export default Navbar;
