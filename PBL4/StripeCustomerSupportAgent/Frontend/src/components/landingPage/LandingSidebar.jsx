import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CHAT,
  LANDING_PAGE,
  DASHBOARD,
  CUSTOMERS,
  KNOWLEDGE,
} from "../../constants/routes";
import AnimatedText from "../animated/AnimatedText";
import { motion, AnimatePresence } from "framer-motion";

const LandingSidebar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOthersOpen, setIsOthersOpen] = useState(false);
  const location = useLocation();

  const mainMenuItems = [
    { name: "Home", path: LANDING_PAGE },
    { name: "Chat", path: CHAT },
    { name: "Knowledge", path: KNOWLEDGE },
    { name: "Dashboard", path: DASHBOARD },
    { name: "Customers", path: CUSTOMERS },
    { name: "Others", path: "#" },
  ];

  const otherMenuItems = [
    { name: "Tools", path: "#" },
    { name: "Admin", path: "#" },
    { name: "Settings", path: "#" },
    { name: "Profile", path: "#" },
  ];

  return (
    <div>
      {/* Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-[4.5rem] bg-stone-700/80 backdrop-blur-md rounded-[0.5rem] flex flex-col items-center justify-center text-text-dark hover:bg-gray-700/80 transition-colors py-2"
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 bg-black rounded-[0.5rem] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-5xl">
              network_intelligence
            </span>
          </div>
          <div
            className="vertical-text font-display font-light text-sm tracking-widest text-text-dark"
            style={{ height: "4rem" }}
          >
            Menu
          </div>
          <div className="grid grid-cols-3 gap-0.5 w-4 pb-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-text-dark rounded-full" />
            ))}
          </div>
        </div>
      </button>

      {/* Horizontal Menu */}
      <div
        className={`fixed top-[50%] left-[8.75%] w-[40.5rem] transform -translate-x-1/2  -rotate-90 bg-stone-700/30 backdrop-blur-md rounded-[0.5rem] shadow-xl border border-gray-600/50 transition-all duration-200 ease-out z-50 ${
          isMenuOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
        style={{
          transformOrigin: "top center",
        }}
      >
        <div className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 max-w-[90vw] sm:max-w-none">
          {/* Main Menu Items */}
          {mainMenuItems.reverse().map((item, index) => {
            if (item.name === "Others") {
              return (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => setIsOthersOpen(true)}
                  onMouseLeave={() => setIsOthersOpen(false)}
                >
                  <button
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-text-dark hover:bg-gray-600/50 transition-all duration-150 whitespace-nowrap text-xs sm:text-sm ${
                      isMenuOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-2"
                    } hover:scale-105 flex items-center gap-1`}
                    style={{
                      transitionDelay: isMenuOpen ? `${index * 50}ms` : "0ms",
                    }}
                  >
                    Others
                    <span className="material-symbols-outlined text-xs">
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isOthersOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-5 w-48 bg-stone-800/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-600/50 py-2 z-[100]"
                      >
                        {otherMenuItems.map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => {
                              // setIsMenuOpen(false);
                              setIsOthersOpen(false);
                            }}
                            className={`block px-4 py-2 text-sm text-text-dark hover:bg-gray-700/50 transition-colors ${
                              location.pathname === item.path
                                ? "bg-primary/20 text-primary"
                                : ""
                            }`}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            } else {
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  // onClick={() => setIsMenuOpen(false)}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-text-dark hover:bg-gray-600/50 transition-all duration-150 whitespace-nowrap text-xs sm:text-sm ${
                    isMenuOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  } ${
                    location.pathname === item.path
                      ? "bg-primary/20 text-primary border border-primary/30 scale-105"
                      : "hover:scale-105"
                  }`}
                  style={{
                    transitionDelay: isMenuOpen ? `${index * 50}ms` : "0ms",
                  }}
                >
                  {item.name}
                </Link>
              );
            }
          })}
        </div>
      </div>

      {/* Stripe.AI Text at Bottom Left */}
      <div className="fixed bottom-6 left-6 z-30">
        <div
          className="vertical-text text-7xl font-thin tracking-tighter text-text-dark"
          style={{ height: "15rem" }}
        >
          <AnimatedText text="Stripe.AI" />
        </div>
      </div>
    </div>
  );
};

export default LandingSidebar;
