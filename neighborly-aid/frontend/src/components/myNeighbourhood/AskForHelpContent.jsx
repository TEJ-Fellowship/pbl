// frontend/src/components/myNeighbourhood/AskForHelpContent.jsx
import React from "react";
import { User, Plus } from "lucide-react";
import TaskCard from "../features/tasks/TaskCard";
import { TaskForm } from "../../components";

const AskForHelpContent = ({
  categories,
  showPostForm,
  handleSetShowPostForm,
  tasks = [],
  loading = false,
  onTaskCreated,
  onTaskUpdate,
}) => {
  return (
    <div className="px-6 pb-20 dark:bg-background-humbleDark dark:text-text-spotlight">
      {/* Create New Request Section */}
      <div className="mb-6">
        {!showPostForm ? (
          <div
            onClick={() => handleSetShowPostForm(true)}
            className="bg-gradient-to-r from-primary-light to-primary rounded-2xl shadow-lg border border-primary/20 p-6 cursor-pointer hover:shadow-xl transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-1">
                  Create New Help Request
                </h3>
                <p className="text-white/80 text-sm">
                  Tell your community what you need help with
                </p>
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm">🛒</span>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm">💻</span>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm">🐕</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <TaskForm
            categories={categories}
            handleSetShowPostForm={handleSetShowPostForm}
            onTaskCreated={onTaskCreated}
          />
        )}
      </div>

      {/* User's Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-dark dark:text-text-spotlight">
            Your Help Requests
          </h2>
          <div className="text-sm text-text-light dark:text-text-spotlight/70">
            {loading ? (
              "Loading..."
            ) : (
              <>
                {tasks.length} request{tasks.length !== 1 ? "s" : ""}
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-background dark:bg-background-politeDark rounded-2xl shadow-sm border border-border dark:border-border-dark p-6 animate-pulse"
              >
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
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              categories={categories}
              showEditOptions={true} // Add this prop to show edit/delete options
              onTaskUpdate={onTaskUpdate}
            />
          ))
        ) : (
          <div className="bg-background dark:bg-background-politeDark rounded-2xl shadow-sm border border-border dark:border-border-dark p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-text-dark dark:text-text-spotlight mb-2">
              No help requests yet
            </h3>
            <p className="text-text-light dark:text-text-spotlight/70 mb-4">
              Create your first help request to get started with your community
            </p>
            <button
              onClick={() => handleSetShowPostForm(true)}
              className="bg-gradient-to-r from-primary-light to-primary text-white px-6 py-2 rounded-full font-medium hover:from-primary hover:to-primary-dark transition-colors"
            >
              Create Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AskForHelpContent;
