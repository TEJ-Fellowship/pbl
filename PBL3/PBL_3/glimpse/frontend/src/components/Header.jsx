import { User, Bell } from "lucide-react";
import { AuthContext } from "../AuthContext";
import { useContext, useState } from "react";

// Header Component
const Header = () => {
  const [isToggle, setIsToggle] = useState(false);
  const { user, handleLogout } = useContext(AuthContext);
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#62649a]">
            Good morning, {user.username}!
          </h1>
          <p className="text-[#809dc6] mt-1">
            Ready to capture today's moment?
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-[#7383b2] hover:bg-[#62649a] text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200">
            Quick Capture
          </button>
          <button className="p-2 text-[#809dc6] hover:text-[#7383b2] transition-colors duration-200">
            <Bell size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#98c9e9] flex items-center justify-center">
            <User  onClick={()=>setIsToggle(!isToggle)} size={16} className="text-[#7383b2] cursor-pointer" />
          </div>
          {isToggle && (
            <div className="absolute mt-32 right-6 w-44 bg-white rounded shadow-lg border border-gray-200 z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Logout
              </button>
              <button
                onClick={() => setIsToggle(false)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Header;
