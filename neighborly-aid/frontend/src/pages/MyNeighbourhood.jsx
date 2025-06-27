import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import NavigationTab from "../components/myNeighbourhood/NavigationTab";
import CategoryFilter from "../components/features/tasks/CategoryFilter";
import Header from "../components/myNeighbourhood/Header";
import HelpOthersContent from "../components/myNeighbourhood/HelpOthersContent";
import AskForHelpContent from "../components/myNeighbourhood/AskForHelpContent";
import { fetchAllTasks, fetchUserTasks } from "../services/taskService";

const MyNeighbourhood = () => {
  const [activeTab, setActiveTab] = useState("helpothers");
  const [showPostForm, setShowPostForm] = useState(false);

  // State for tasks
  const [allTasks, setAllTasks] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for categories - you might want to move this to a constants file
  const categories = [
    {
      id: "all",
      name: "All Tasks",
      icon: "🏠",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "groceries",
      name: "Groceries",
      icon: "🛒",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "tech",
      name: "Tech Help",
      icon: "💻",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "pets",
      name: "Pet Care",
      icon: "🐕",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "transport",
      name: "Transport",
      icon: "🚗",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "cleaning",
      name: "Cleaning",
      icon: "🧹",
      color: "bg-green-100 text-green-800",
    },
  ];

  // Fetch tasks on component mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both all tasks and user tasks in parallel
        const [allTasksData, userTasksData] = await Promise.all([
          fetchAllTasks(),
          fetchUserTasks().catch(() => []), // Don't fail if user tasks can't be fetched
        ]);

        setAllTasks(allTasksData);
        setUserTasks(userTasksData);
      } catch (err) {
        console.error("Error loading tasks:", err);
        setError("Failed to load tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Refresh tasks when a new task is created
  const refreshTasks = async () => {
    try {
      const [allTasksData, userTasksData] = await Promise.all([
        fetchAllTasks(),
        fetchUserTasks().catch(() => []),
      ]);

      setAllTasks(allTasksData);
      setUserTasks(userTasksData);
    } catch (err) {
      console.error("Error refreshing tasks:", err);
    }
  };

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    // Don't automatically show form when switching tabs
    // Form will be shown when user clicks the create button
  };

  const handleSetShowPostForm = (show) => {
    setShowPostForm(show);
    // When showing post form, automatically switch to "Ask for help!" tab
    if (show) {
      setActiveTab("askforhelp");
    }
  };

  // Handle successful task creation
  const handleTaskCreated = () => {
    setShowPostForm(false);
    refreshTasks(); // Refresh the tasks list
  };

  // Handle task updates (when someone accepts or completes a task)
  const handleTaskUpdate = (updatedTask) => {
    // Update the task in both allTasks and userTasks arrays
    setAllTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );

    setUserTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-green-100 dark:bg-background-politeDark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-light dark:text-text-spotlight">
            Loading tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-green-100 dark:bg-background-politeDark">
      {/* Header */}
      <Header />

      <div className="w-full dark:bg-background-humbleDark">
        {/* Navigation Tabs */}
        <NavigationTab
          activeTab={activeTab}
          handleSetActiveTab={handleSetActiveTab}
        />

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={refreshTasks}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === "helpothers" && (
          <HelpOthersContent
            categories={categories}
            showPostForm={showPostForm}
            handleSetShowPostForm={handleSetShowPostForm}
            tasks={allTasks}
            loading={loading}
            onTaskUpdate={handleTaskUpdate}
          />
        )}

        {activeTab === "askforhelp" && (
          <AskForHelpContent
            categories={categories}
            showPostForm={showPostForm}
            handleSetShowPostForm={handleSetShowPostForm}
            tasks={userTasks}
            loading={loading}
            onTaskCreated={handleTaskCreated}
            onTaskUpdate={handleTaskUpdate}
          />
        )}

        {/* Floating Action Button - only show on Help Others tab */}
        {activeTab === "helpothers" && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => handleSetShowPostForm(true)}
              className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyNeighbourhood;
