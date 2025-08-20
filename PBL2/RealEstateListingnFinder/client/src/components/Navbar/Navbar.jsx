import { Star, Bell } from "lucide-react";
import { Link } from "react-router-dom";
const Navbar = () => {
  return (
    <>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-gray-200 px-10 py-3">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-gray-900">
            <div className="size-4">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tighter">
              Mero Ghar
            </h2>
          </div>
          <div className="flex items-center gap-9">
            <Link
              to="/explore"
              className="text-gray-900 text-sm font-medium leading-normal hover:text-blue-600 cursor-pointer"
            >
              Explore Property
            </Link>
            <Link
              className="text-gray-900 text-sm font-medium leading-noraml hover:text-blue-600 cursor-pointer"
              to="/manage-property"
            >
              Manage Property
            </Link>
          </div>
        </div>

        <div className="flex flex-1 justify-end gap-8">
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-gray-100 text-gray-900 gap-2 text-sm font-bold  leading-normal  tracking-wide min-w-0 px-2.5 hover:bg-gray-200">
            <Bell className="w-5 h-5" />
          </button>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-gradient-to-br from-blue-400 to-purple-500"></div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
