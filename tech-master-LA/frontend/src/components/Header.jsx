import { Settings, User } from "lucide-react";

const Header = () => {
  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-red-500 rounded-full relative">
              <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full transform translate-x-1 -translate-y-1"></div>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold">TechMaster</h1>
            <p className="text-gray-400 text-sm">
              Your AI-powered study companion
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white">
            <Settings size={20} />
          </button>
          <button className="text-gray-400 hover:text-white">
            <User size={20} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;
