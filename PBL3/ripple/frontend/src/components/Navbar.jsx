import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [activeItem, setActiveItem] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);


  const navItems = ["Home", "Explore", "Notifications", "Activity Log"];
  const navRoutes = {
    Home: "/dashboard",
    Explore: "/explore",
    Notifications: "/notification",
    "Activity Log": "/activitylog",
  };

  const url = "http://localhost:5000";

  const handleNavClick = (item) => {
    setActiveItem(item);

    const route = navRoutes[item];
    if (route) navigate(route);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleViewProfile = () => {
    setIsDropdownOpen(false);
    // Navigates to profile page

    navigate("/profile");
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    // Handle logout logic here (clear tokens, etc.)
    // Then navigate to login page
    try {
      const response = await fetch(`${url}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error("logout failed", error.message);
    }

    navigate("/");

  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };


    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

    };
  }, []);

  return (
    <nav className="w-full bg-gray-900/100 border-b border-gray-700 px-8 py-2">
      <div className="flex items-center justify-between w-full">

        <div className="flex items-center justify-centergap-3">
          <div className="w-48 relative top-[-10px]">

            <img src="/logo2.png" alt="logo" />
          </div>
        </div>

        <div className="flex items-center space-x-8">
          {navItems.map((item) => (
            <button

              key={item}
              onClick={() => handleNavClick(item)}
              className={`relative px-4 py-2 font-medium transition-colors group ${
                activeItem === item
                  ? "text-white"
                  : "text-gray-400 hover:text-white"

              }`}
            >
              {item}
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 transform transition-transform origin-left duration-200 ${
                  activeItem === item ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              ></div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Settings Icon */}
          <button className="p-2 rounded-lg w-10 border-2 border-transparent transition-colors hover:border-green-500">
            <img src="/settings.png" alt="setting" />
          </button>

          {/* Profile Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>

            <button

              onClick={handleProfileClick}
              className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-green-400 transition-all"
            >
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={handleViewProfile}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Profile
                  </button>
                  
                  <hr className="my-1 border-gray-700" />
                  

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />

                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </nav>
  );
};


export default Navbar;

