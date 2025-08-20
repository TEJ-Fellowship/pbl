import {
  CircleCheckBigIcon,
  Goal,
  TrendingUp,
  Calendar,
  Tag,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import React, { useState, useEffect } from "react";

const GoalTracker = () => {
  const [goals, setGoals] = useState(() => {
    const savedGoals = localStorage.getItem("goals");
    const parsedGoals = savedGoals ? JSON.parse(savedGoals) : initialGoals;
    console.log("Loaded goals from localStorage:", parsedGoals);
    return parsedGoals;
  });
  const [showModal, setShowModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "",
    deadline: "",
    progress: 0,
  });
  useEffect(() => {
    localStorage.setItem("goals", JSON.stringify(goals));
    console.log("Saved goals to localStorage:", goals);
  }, [goals]);

  useEffect(() => {
    const checkOverdueGoals = () => {
      const today = new Date();
      const updatedGoals = goals.map((goal) => {
        const deadline = new Date(goal.deadline);
        return {
          ...goal,
          isOverdue: deadline <= today,
        };
      });

      if (JSON.stringify(updatedGoals) !== JSON.stringify(goals)) {
        setGoals(updatedGoals);
      }
    };

    checkOverdueGoals();
  }, [goals]);

  const stats = [
    {
      title: "Total Goals",
      value: goals.length.toString(),
      icon: Goal,
      color: "text-blue-700/80 dark:text-blue-100",
    },
    {
      title: "Completed",
      value: goals.filter((goal) => goal.progress === 100).length.toString(),
      icon: CircleCheckBigIcon,
      color: "text-green-600",
    },
    {
      title: "Average Progress",
      value: goals.length
        ? `${Math.round(
            goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length
          )}%`
        : "0%",
      icon: TrendingUp,
      color: "text-green-600",
    },
  ];
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal({
      ...newGoal,
      [name]: name === "progress" ? parseInt(value, 10) : value,
    });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const today = new Date();
    const deadline = new Date(newGoal.deadline);

    const newGoalObj = {
      id: Date.now(),
      ...newGoal,
      isOverdue: deadline < today,
    };
    setGoals([...goals, newGoalObj]);
    setShowModal(false);
    setNewGoal({
      title: "",
      description: "",
      category: "",
      deadline: "",
      progress: 0,
    });
  };
  const updateProgress = (id, increment) => {
    setGoals(
      goals.map((goal) => {
        if (goal.id === id) {
          const newProgress = Math.min(
            100,
            Math.max(0, goal.progress + increment)
          );
          return { ...goal, progress: newProgress };
        }
        return goal;
      })
    );
  };
  const markComplete = (id) => {
    setGoals(
      goals.map((goal) => {
        if (goal.id === id) {
          return { ...goal, progress: 100 };
        }
        return goal;
      })
    );
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter((goal) => goal.id !== id));
  };

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-slate-700 dark:text-white mb-2">
          Goal Tracker
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track your career progress and achievements
        </p>
      </div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600/90 text-white px-2 py-3 mr-16 rounded-md flex items-center gap-2 transition duration-700"
        >
          <span className="flex gap-1">
            {<Plus className="w-5 h-6" />}Add Goal
          </span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Add New Goal
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {<X className="h-5 w-5" />}
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newGoal.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Complete Machine Learning Course"
                  className="w-full px-3 py-2 text-slate-600 dark:text-slate-100 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newGoal.description}
                  onChange={handleInputChange}
                  placeholder="Describe your goal in detail..."
                  className="w-full px-3 text-slate-600 dark:text-slate-100 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800"
                  rows="3"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={newGoal.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Technical Skills"
                    className="w-full text-slate-600 dark:text-slate-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={newGoal.deadline}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-slate-600 dark:text-slate-100 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600/80 dark:bg-blue-500/90 text-white rounded-md hover:bg-blue-600/70 dark:hover:bg-blue-600/70"
                >
                  Add Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-10">
        {stats.map((stat, index) => {
          return (
            <div
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-5xl rounded-2xl p-6 h-50 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300 group"
              key={index}
            >
              <div className="flex text-center mr-3">
                <div className="flex-1">
                  <div className="flex text-center justify-center">
                    {<stat.icon className={`w-9 h-9 ${stat.color}`} />}
                  </div>
                  <p className="text-3xl p-3 font-bold text-slate-800 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm -mb-3 font-medium text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-10 justify-center">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                {goal.title}
                {goal.isOverdue && (
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-300">
                    Overdue
                  </span>
                )}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => markComplete(goal.id)}
                  className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400"
                >
                  <CircleCheckBigIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                >
                  {<Trash2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {goal.description}
            </p>

            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <Tag className="w-4 h-4 mr-1" />
                {goal.category}
              </div>
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(goal.deadline).toLocaleDateString()}
              </div>
            </div>

            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Progress
                </span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {goal.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-green-600/80 h-2.5 rounded-full"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <div className="flex gap-1">
                <button
                  onClick={() => updateProgress(goal.id, 5)}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm"
                >
                  +5%
                </button>
                <button
                  onClick={() => updateProgress(goal.id, 10)}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm"
                >
                  +10%
                </button>
              </div>
            </div>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No goals added yet
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default GoalTracker;
