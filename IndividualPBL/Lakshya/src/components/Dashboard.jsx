import React from "react";
import StatCard from "./StatCard";
import Career from "../pages/Career.jsx";



const Dashboard = () => {
  return (
    <>
        <div className="p-3 ">
          <h1 className="font-bold text-3xl text-slate-800/90 dark:text-slate-100/80">Your Career Journey</h1>
          <p className="text-sm text-slate-700 dark:text-slate-100/80">
            Track Your Progress, Explore Opportuinities, and achieve your career
            goals
          </p>
        </div>
        <div className="space-y-6">
          <StatCard />
        </div>
    </>
  );
};

export default Dashboard;
