import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import NavigationTab from "../components/myNeighbourhood/NavigationTab";
import CategoryFilter from "../components/features/tasks/CategoryFilter";
import Header from "../components/myNeighbourhood/Header";
import HelpOthersContent from "../components/myNeighbourhood/HelpOthersContent";
import AskForHelpContent from "../components/myNeighbourhood/AskForHelpContent";
import { fetchAllTasks, fetchUserTasks } from "../services/taskService";
import { useCategories } from "../hooks/useCategories";

const MyNeighbourhood = () => {
  const [activeTab, setActiveTab] = useState("helpothers");
  const [showPostForm, setShowPostForm] = useState(false);

  // State for tasks
  const [allTasks, setAllTasks] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use categories from backend
  const { 
    categories, 
    loading: categoriesLoading, 
    error: categoriesError, 
    ensureCategoryExists,
    refreshCategories
  } = useCategories();

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

  // Handle combined loading state and errors
  const isLoading = loading || categoriesLoading;
  const hasError = error || categoriesError;

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
  const handleTaskCreated = async () => {
    setShowPostForm(false);
    // Refresh both tasks and categories
    await Promise.all([
      refreshTasks(),
      refreshCategories()
    ]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-green-100 dark:bg-background-politeDark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-light dark:text-text-spotlight">Loading tasks and categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-green-100 dark:bg-background-politeDark">
      {/* App Container */}
      <div className="max-w-6xl mx-auto relative min-h-screen">
        {/* Header */}
        <Header />

      <div className="w-full dark:bg-background-humbleDark">
        {/* Navigation Tabs */}
        <NavigationTab
          activeTab={activeTab}
          handleSetActiveTab={handleSetActiveTab}
        />
        
        {hasError && (
          <div className="mx-6 mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{hasError}</p>
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
            onTaskUpdate={refreshTasks}
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
            ensureCategoryExists={ensureCategoryExists}
          />
        )}

        {/* Floating Action Button - positioned relative to app container */}
        {activeTab === "helpothers" && (
          <div className="absolute bottom-6 right-6 z-50">
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
