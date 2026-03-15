import React from "react";
import { ChevronDown, Menu } from "lucide-react";
import { Sun } from "lucide-react";
import { Bell } from "lucide-react";
import { Search } from "lucide-react";
import { Settings } from "lucide-react";
import Themetoggle from "./Themetoggle";
import Mahesh from '../assets/mahesh.jpg'

const Header = ({hideSidebar, onToggleSidebar}) => {
  return (
    <>
      <div className="bg-white/-80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={onToggleSidebar}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:block">
              <h1 className="text-2xl font-black text-slate-800/90 dark:text-white">
                Dashboard
              </h1>
              <p className="text-slate-800 dark:text-white">
                Hey Welcome, How is your day?{" "}
              </p>
            </div>
          </div>
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search for Anything"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus;ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-10 ">
            <Themetoggle />
            <button className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-700">
            <img
              src={Mahesh}
              alt="user"
              className="w-8 h-8 rounded-full ring-2 ring-blue-500"
            />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Mahesh Chaudhary
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Learner
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;