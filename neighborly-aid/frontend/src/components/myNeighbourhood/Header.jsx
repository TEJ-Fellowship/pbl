import React, { useState } from "react";
import { Bell, User } from "lucide-react";
import UserModal from "../ui/UserModal";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleIsOpen = () => {
    setIsOpen((prev) => !prev);
  };
  return (
    <>
      <div className="bg-white/80 dark:bg-background-humbleDark backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              HelpBoard
            </h1>
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-gray-600" />
              <button
                onClick={handleIsOpen}
                className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center hover:from-green-500 hover:to-green-700 transition-all duration-200 cursor-pointer"
              >
                <User className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <UserModal isOpen={isOpen} handleIsOpen={handleIsOpen} />
    </>
  );
};

export default Header;
