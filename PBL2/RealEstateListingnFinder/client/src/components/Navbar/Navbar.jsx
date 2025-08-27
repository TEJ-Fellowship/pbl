import { Star, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Themetoggle from "../Theme/Themetoggle";
import real from '../../assets/login.jpg'

const Navbar = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <header className="flex items-center  h-16 justify-between whitespace-nowrap border-b border-solid border-b-gray-200 px-10 py-3">
      {/* Logo Section */}
      <div className="flex items-center justify-between w-full gap-8">
        <div className="flex items-center gap-4 text-gray-900">
          <div className="size-4">
            <Star className="w-4 h-4 fill-current" />
          </div>
          <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tighter">
            Mero Ghar
          </h2>
          {isLandingPage ? (
            <>
              <Link
                to="/about"
                className="p-8 text-gray-900 text-base font-medium leading-normal hover:text-blue-600 cursor-pointer"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="p-2 text-gray-900 text-base font-medium leading-normal hover:text-blue-600 cursor-pointer"
              >
                Contact
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/explore"
                className="p-8 text-gray-900 text-base font-medium leading-normal hover:text-blue-600 cursor-pointer"
              >
                Explore Property
              </Link>
              <Link
                to="/manage-property"
                className="p-2 text-gray-900 text-base font-medium leading-normal hover:text-blue-600 cursor-pointer"
              >
                Manage Property
              </Link>
            </>
          )}
        </div>

        {/* Dynamic Links */}
        <div className="flex items-center gap-8">
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-gray-100 text-gray-800 gap-1 text-sm font-bold leading-normal tracking-wide min-w-0 hover:bg-gray-200">
            <Themetoggle className="w-5 h-5" />
          </button>
        </div>
        {isLandingPage ? (
          <div className="flex items-center gap-8">
            <Link
              to="/auth"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-8">
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-gray-100 text-gray-800 gap-1 text-sm font-bold leading-normal tracking-wide min-w-0 hover:bg-gray-200">
              <Themetoggle className="w-5 h-5" />
            </button>
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-gray-100 text-gray-900 gap-2 text-sm font-bold leading-normal tracking-wide min-w-0 px-2.5 hover:bg-gray-200">
              <Bell className="w-5 h-5" />
            </button>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-gradient-to-br from-blue-400 to-purple-500"></div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
