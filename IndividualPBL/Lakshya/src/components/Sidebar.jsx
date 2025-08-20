import React from "react";
import logo from "../assets/logo.png";
import userImage from "../assets/mahesh.jpg";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  BrainCircuit,
  BriefcaseIcon,
  Calendar,
  ChartColumn,
  Goal,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";

const menus = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    active: true,
  },
  {
    id: "career interest",
    icon: BriefcaseIcon,
    label: "Career",
  },
  {
    id: "goal tracker",
    icon: TrendingUp,
    label: "Goal Tracker",
  },
  {
    id: "AI Advisor",
    icon: BrainCircuit,
    label: "AI Advisor",
  },
  {
    id: "job market",
    icon: ChartColumn,
    label: "Job Market",
  },
  {
    id: "Resources",
    icon: BookOpen,
    label: "Resources",
  },
  {
    id: "calendar",
    icon: Calendar,
    label: "Calendar",
  },
];

const Sidebar = ({ collapse, currentPage, onPageChange }) => {
  const navigate = useNavigate();
  const menuRoutes = {
    dashboard: "/",
    "career interest": "/career",
    "goal tracker": "/goaltracker",
    "AI Advisor": "/aiadvisor",
    "job market": "/jobmarket",
    Resources: "/resources",
    calendar: "/calendar",
  };
  return (
    <>
      <div
        className={`${
          collapse ? "w-20" : "w-72"
        } transition duration-300 ease-in-out bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col relative z-10`}
      >
        {!collapse && (
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
            <img src={logo} alt="logo" className="w-[11rem]"></img>
          </div>
        )}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menus.map((item) => {
            return (
              <div key={item.id}>
                <button
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                    currentPage === item.id
                      ? "bg-blue-500/70 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                  onClick={() => {
                    onPageChange(item.id);
                    navigate(menuRoutes[item.id]);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={`w-5 h-5`} />
                    {!collapse && (
                      <span className="font-medium ml-2">{item.label}</span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-200 dark: bg-slate-700/10">
            <img
              src={userImage}
              alt="user"
              className="w-10 h-10 rounded-full ring-2 ring-blue-500"
            ></img>
            {!collapse && (
              <div className="flex-1 min-w-0">
                <div className="flex-1 min=w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-white truncate">
                    Mahesh Chaudhary
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-400 truncate">
                    Learner
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
