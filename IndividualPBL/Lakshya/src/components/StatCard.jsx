import {
  ArrowDownRight,
  ArrowRight,
  Book,
  BookOpen,
  Brain,
  Briefcase,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { PieChart, BarChart } from "@mui/x-charts";

const stats = [
  {
    title: "Career Interest",
    sub: "Area of focus",
    value: "3",
    change: "3 new",
    trend: "up",
    icon: Briefcase,
  },
  {
    title: "Active Goals",
    sub: "Learning",
    value: "3",
    change: "85% avg",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Completed Courses",
    sub: "This Year",
    value: "3",
    change: "+5 this month",
    trend: "up",
    icon: BookOpen,
  },
  {
    title: "AI Recommendation",
    sub: "Pending Review",
    value: "3",
    trend: "up",
    icon: Brain,
  },
];

const StatCard = () => {
  const [userInterests, setUserInterests] = useState([]);
  const [goals, setGoals] = useState([]);
  const [statsData, setStatsData] = useState(stats);

  useEffect(() => {
    try {
      const savedInterests = localStorage.getItem("careerInterests");
      if (savedInterests) {
        const parsedInterests = JSON.parse(savedInterests);
        setUserInterests(parsedInterests);

        setStatsData((prev) =>
          prev.map((stat) =>
            stat.title === "Career Interest"
              ? { ...stat, value: parsedInterests.length.toString() }
              : stat
          )
        );
      }

      const savedGoals = localStorage.getItem("goals");
      if (savedGoals) {
        const parsedGoals = JSON.parse(savedGoals);
        setGoals(parsedGoals);

        setStatsData((prev) =>
          prev.map((stat) =>
            stat.title === "Active Goals"
              ? { ...stat, value: parsedGoals.length.toString() }
              : stat
          )
        );
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
    }
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-8 mb-9">
        {statsData.map((stat, index) => {
          return (
            <div
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 h-60 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300 group"
              key={index}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xl font-medium text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {stat.sub}
                  </p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
                    {stat.value}
                  </p>
                  <div className="flex items-center space-x-2">
                    {stat.trend === "up" ? (
                      <ArrowRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        stat.trend === "up"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400"></span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white group-hover:scale-110 transition-all duration-300`}
                >
                  {<stat.icon className={`w-6 h-6`} />}
                </div>
              </div>
              <div className="mt-5 h2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`w-full bg-gradient-to-r rounded-full transition-all duration-100`}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-4 pt-1">
        {/* Career Interests Panel */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 h-96 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300 group overflow-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Career Interests
            </h3>
          </div>

          <div className="space-y-3">
            {/* Interest Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {userInterests.length > 0 ? (
                userInterests.map((interest, index) => {
                  const bgColors = [
                    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300",
                    "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
                    "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
                    "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
                    "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
                  ];

                  return (
                    <span
                      key={index}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        bgColors[index % bgColors.length]
                      }`}
                    >
                      {interest}
                    </span>
                  );
                })
              ) : (
                <span className="text-slate-500 dark:text-slate-400 italic">
                  No interests set
                </span>
              )}
            </div>

            {/* Interest Chart Visualization */}
            {userInterests.length > 0 && (
              <div className="h-52 flex items-center justify-center mb-3">
                <PieChart
                  series={[
                    {
                      data: userInterests.map((interest, index) => ({
                        id: index,
                        value: Math.floor(Math.random() * 50) + 30,
                        label: interest,
                      })),
                      innerRadius: 30,
                      outerRadius: 80,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      startAngle: -90,
                      endAngle: 270,
                      cx: 150,
                      cy: 90,
                    },
                  ]}
                  width={300}
                  height={200}
                  slotProps={{
                    legend: {
                      position: "bottom",
                      labelStyle: {
                        fontSize: 12,
                        fill: document.documentElement.classList.contains(
                          "dark"
                        )
                          ? "rgb(148 163 184)"
                          : "rgb(71 85 105)",
                      },
                    },
                  }}
                  colors={[
                    "#6366f1", // indigo
                    "#a855f7", // purple
                    "#3b82f6", // blue
                    "#ec4899", // pink
                    "#10b981", // emerald
                  ]}
                  margin={{ top: 0, bottom: 30, left: 0, right: 0 }}
                />
              </div>
            )}

            {/* Interest Details */}
            <div className="space-y-4">
              {userInterests.length > 0 ? (
                userInterests.slice(0, 3).map((interest, index) => {
                  const descriptions = {
                    "AI/Machine Learning":
                      "Skills focused on neural networks, deep learning, and AI model development.",
                    "Product Management":
                      "Product strategy, roadmapping, and user-centered design approaches.",
                    "Data Science":
                      "Statistical analysis, data visualization, and predictive modeling.",
                    "Web Development":
                      "Creating responsive websites and web applications using modern frameworks.",
                    "UX/UI Design":
                      "Designing user-friendly interfaces and optimizing user experiences.",
                    Cybersecurity:
                      "Protecting systems and data from digital attacks and threats.",
                    "Cloud Computing":
                      "Managing and delivering services through internet-based cloud platforms.",
                  };

                  return (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                    >
                      <h4 className="font-medium text-slate-800 dark:text-slate-200">
                        {interest}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {descriptions[interest] ||
                          `Skills and knowledge related to ${interest}.`}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    Add career interests to see details
                  </p>
                </div>
              )}
            </div>

            <button className="mt-3 w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Manage Interests
            </button>
          </div>
        </div>

        {/* Goal Progress Panel */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 h-96 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300 group overflow-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Goal Progress
            </h3>
          </div>

          {goals.length > 0 && (
            <div className="h-52 mb-4">
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: goals.map((goal) =>
                      goal.title.length > 12
                        ? goal.title.substring(0, 12) + "..."
                        : goal.title
                    ),
                    labelStyle: {
                      fontSize: 10,
                      fill: document.documentElement.classList.contains("dark")
                        ? "rgb(148 163 184)"
                        : "rgb(71 85 105)",
                    },
                  },
                ]}
                yAxis={[
                  {
                    max: 100,
                    tickMinStep: 20,
                    valueFormatter: (value) => `${value}%`,
                    labelStyle: {
                      fill: document.documentElement.classList.contains("dark")
                        ? "rgb(148 163 184)"
                        : "rgb(71 85 105)",
                    },
                  },
                ]}
                series={[
                  {
                    data: goals.map(
                      (goal) => goal.progress || Math.floor(Math.random() * 100)
                    ),
                    color: "#3b82f6",
                    label: "Progress %",
                    valueFormatter: (value) => `${value}%`,
                  },
                ]}
                width={300}
                height={200}
                margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
              />
            </div>
          )}

          <div className="space-y-6">
            {goals.length > 0 ? (
              goals.slice(0, 3).map((goal, index) => {
                const progress =
                  goal.progress || Math.floor(Math.random() * 100);
                const dueDateObj = new Date(goal.deadline);
                const today = new Date();
                const diffTime = Math.abs(dueDateObj - today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let dueText = "";
                if (diffDays === 0) dueText = "Due today";
                else if (diffDays === 1) dueText = "Due tomorrow";
                else if (diffDays < 7) dueText = `Due in ${diffDays} days`;
                else if (diffDays < 30)
                  dueText = `Due in ${Math.ceil(diffDays / 7)} weeks`;
                else dueText = `Due on ${dueDateObj.toLocaleDateString()}`;

                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1.5">
                      <h4 className="font-medium text-slate-800 dark:text-white">
                        {goal.title}
                      </h4>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {dueText}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {goal.category}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  No goals set
                </p>
              </div>
            )}

            <button className="mt-3 w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              View All Goals
            </button>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 h-96 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300 group overflow-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              AI Recommendations
            </h3>
          </div>

          <div className="space-y-4">
            {/* Recommendation Chart */}
            {userInterests.length > 0 && (
              <div className="h-52 mb-4">
                <PieChart
                  series={[
                    {
                      data: [
                        {
                          id: 0,
                          value: Math.floor(Math.random() * 20) + 70,
                          label: "Skills Match",
                        },
                        {
                          id: 1,
                          value: Math.floor(Math.random() * 30) + 60,
                          label: "Industry Growth",
                        },
                        {
                          id: 2,
                          value: Math.floor(Math.random() * 25) + 65,
                          label: "Learning Path",
                        },
                        {
                          id: 3,
                          value: Math.floor(Math.random() * 35) + 55,
                          label: "Job Market",
                        },
                      ],
                      innerRadius: 30,
                      outerRadius: 80,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      startAngle: -90,
                      endAngle: 270,
                      cx: 150,
                      cy: 90,
                    },
                  ]}
                  width={300}
                  height={200}
                  slotProps={{
                    legend: {
                      position: "bottom",
                      labelStyle: {
                        fontSize: 12,
                        fill: document.documentElement.classList.contains(
                          "dark"
                        )
                          ? "rgb(148 163 184)"
                          : "rgb(71 85 105)",
                      },
                    },
                  }}
                  colors={[
                    "#a855f7", // purple
                    "#3b82f6", // blue
                    "#ec4899", // pink
                    "#10b981", // emerald
                  ]}
                  margin={{ top: 0, bottom: 30, left: 0, right: 0 }}
                />
              </div>
            )}

            {/* Dynamic Recommendations based on interests */}
            {userInterests.map((interest, index) => {
              const recommendations = {
                "AI/Machine Learning": {
                  text: "Complete a certification in Machine Learning fundamentals",
                  color: "border-blue-400 dark:border-blue-600",
                },
                "Product Management": {
                  text: "Consider exploring Product Management roles in tech companies",
                  color: "border-purple-400 dark:border-purple-600",
                },
                "Data Science": {
                  text: "Build a portfolio of data visualization projects",
                  color: "border-green-400 dark:border-green-600",
                },
                "Web Development": {
                  text: "Learn React and Next.js for modern frontend development",
                  color: "border-amber-400 dark:border-amber-600",
                },
                "UX/UI Design": {
                  text: "Create user journey maps for popular applications",
                  color: "border-pink-400 dark:border-pink-600",
                },
              };

              const defaultRec = {
                text: `Explore courses related to ${interest}`,
                color: "border-indigo-400 dark:border-indigo-600",
              };

              const recommendation = recommendations[interest] || defaultRec;

              // Only show the first 3 recommendations to avoid overflow
              if (index < 3) {
                return (
                  <div
                    key={index}
                    className={`p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 ${recommendation.color}`}
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {recommendation.text}
                    </p>
                  </div>
                );
              }
              return null;
            })}

            {userInterests.length === 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  Add career interests to get AI recommendations
                </p>
              </div>
            )}

            <button className="mt-3 w-full py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
              Get More Insights
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StatCard;
