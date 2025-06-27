// frontend/src/components/myNeighbourhood/HelpOthersContent.jsx
import React, { useState } from "react";
import { User, Search, Filter } from "lucide-react";
import TaskCard from "../features/tasks/TaskCard";
import CategoryFilter from "../features/tasks/CategoryFilter";
import { TaskForm } from "../../components";

const HelpOthersContent = ({
  categories,
  handleSetShowPostForm,
  tasks = [],
  loading = false,
  onTaskUpdate,
}) => {
  // Local state for category filtering within this component
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filter tasks based on selected category
  const filteredTasks = tasks.filter(
    (task) => selectedCategory === "all" || task.category === selectedCategory
  );

  // Get category name for display
  const getCategoryName = () => {
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : "All Tasks";
  };

  // Handle category selection
  const handleSetSelectedCategory = (category) => {
    setSelectedCategory(category);
  };

  // Reset category to "all"
  const resetCategoryFilter = () => {
    setSelectedCategory("all");
  };

  return (
    <div className="min-h-screen dark:bg-background-humbleDark dark:text-text-spotlight">
      {/* Category Filter - integrated within this component */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        handleSetSelectedCategory={handleSetSelectedCategory}
      />

      {/* Tasks Feed - Other Users' Tasks */}
      <div className="px-6 pb-20 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-dark dark:text-text-spotlight mb-3">
            Available Help Requests
          </h2>
          <div className="text-sm text-text-light dark:text-text-spotlight/70">
            {loading ? (
              "Loading..."
            ) : (
              <>
                {filteredTasks.length} request{filteredTasks.length !== 1 ? 's' : ''} 
                {selectedCategory !== "all" && ` in ${getCategoryName()}`}
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              categories={categories}
              onTaskUpdate={onTaskUpdate}
            />
          ))
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              {selectedCategory === "all" ? (
                <Search className="w-8 h-8 text-gray-400" />
              ) : (
                <Filter className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            {selectedCategory === "all" ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No help requests available
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Be the first to post a help request in your community!
                </p>
                <button
                  onClick={() => handleSetShowPostForm(true)}
                  className="bg-gradient-to-r from-primary-light to-primary text-white px-6 py-2 rounded-full font-medium hover:from-primary hover:to-primary-dark transition-colors"
                >
                  Create First Request
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No {getCategoryName().toLowerCase()} requests found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  There are currently no help requests in the {getCategoryName().toLowerCase()} category. 
                  Try checking other categories or create the first one!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => handleSetShowPostForm(true)}
                    className="bg-gradient-to-r from-primary-light to-primary text-white px-6 py-2 rounded-full font-medium hover:from-primary hover:to-primary-dark transition-colors"
                  >
                    Create {getCategoryName()} Request
                  </button>
                  <button
                    onClick={resetCategoryFilter}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    View All Categories
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpOthersContent;