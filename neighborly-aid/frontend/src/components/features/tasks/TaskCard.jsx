import React, { useState, useContext, useEffect } from "react";
import { MapPin, Star, Heart, Users, CloudCog } from "lucide-react";
import { acceptTask, likeTask, completeTask } from "../../../api/tasks";
import AuthContext from "../../../context/AuthContext";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../../ui/ConfirmationModal";
import HelpersModal from "./HelpersModal";

const TaskCard = ({ task, categories, onTaskUpdate }) => {
  const { user } = useContext(AuthContext);
  const [isLiking, setIsLiking] = useState(false);
  const [currentTask, setCurrentTask] = useState(task);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHelpersModal, setShowHelpersModal] = useState(false);

  // Update currentTask when task prop changes
  useEffect(() => {
    setCurrentTask(task);
  }, [task]);
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800`;
      case "medium":
        return `bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800`;
      case "low":
        return `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800`;
      default:
        return `bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700`;
    }
  };

  console.log("currentTask", currentTask);
  console.log("Task status:", currentTask.status);
  // Status icons remain the same
  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return "🔓";
      case "in_progress":
        return "⏳";
      case "completed":
        return "✅";
      default:
        return "🔓";
    }
  };

  // Handle like button click
  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like tasks");
      return;
    }

    if (isLiking) return; // Prevent multiple clicks

    setIsLiking(true);
    try {
      const result = await likeTask(currentTask.id || currentTask._id);

      // Update the current task state
      setCurrentTask((prev) => ({
        ...prev,
        likes: result.task.likes,
        likedBy: result.task.likedBy,
      }));

      // Call parent update function if provided
      if (onTaskUpdate) {
        onTaskUpdate(result.task);
      }

      // Removed toast notification for like/unlike
    } catch (error) {
      console.error("Error liking task:", error);
      toast.error(error.error || "Failed to like task");
    } finally {
      setIsLiking(false);
    }
  };

  // Check if current user has liked this task
  const isLikedByUser =
    currentTask.likedBy?.some(
      (likedUser) => likedUser._id === user?.id || likedUser === user?.id
    ) || false;

  // Check if current user is already helping with this task
  const isUserHelping = Array.isArray(currentTask.helpers)
    ? currentTask.helpers.some(
        (helper) =>
          helper.userId?._id === user?.id || helper.userId === user?.id
      )
    : false;

  // Check if current user is the task creator
  const isUserCreator =
    currentTask.createdBy?._id === user?.id ||
    currentTask.createdBy === user?.id;

  // Check if current user is the selected helper
  const isSelectedHelper = Array.isArray(currentTask.helpers)
    ? currentTask.helpers.some(
        (helper) =>
          (helper.userId?._id === user?.id || helper.userId === user?.id) &&
          helper.status === "selected"
      )
    : false;

  const handleAcceptTask = () => {
    if (!user) {
      toast.error("Please log in to help with tasks");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmAcceptTask = async () => {
    setShowConfirmModal(false);

    // Prevent multiple clicks
    if (isAccepting) return;
    setIsAccepting(true);

    try {
      const result = await acceptTask(currentTask.id || currentTask._id);

      // Update the current task state with the response
      setCurrentTask((prev) => ({
        ...prev,
        status: result.status,
        helpers: result.helpers || prev.helpers,
      }));

      // Call parent update function if provided
      if (onTaskUpdate) {
        onTaskUpdate(result);
      }

      toast.success("You're now helping with this task! 🎉");
    } catch (error) {
      console.error("Error accepting task:", error);
      const errorMessage = error.error || "Failed to accept task";
      toast.error(errorMessage);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!user) {
      toast.error("Please log in to complete tasks");
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to mark "${currentTask.title}" as completed? This action cannot be undone.`
    );

    if (!confirmed) return;

    if (isCompleting) return;
    setIsCompleting(true);

    try {
      const result = await completeTask(currentTask.id || currentTask._id);

      // Update the current task state with the response
      setCurrentTask((prev) => ({
        ...prev,
        status: result.status,
        completedAt: result.completedAt,
      }));

      // Call parent update function if provided
      if (onTaskUpdate) {
        onTaskUpdate(result);
      }

      toast.success("Task completed successfully! 🎉");
    } catch (error) {
      console.error("Error completing task:", error);
      const errorMessage = error.error || "Failed to complete task";
      toast.error(errorMessage);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="bg-background dark:bg-background-politeDark rounded-2xl shadow-sm border border-border dark:border-border-dark overflow-hidden mb-4 hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setShowHelpersModal(true)}
      >
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center text-background text-xl">
            {currentTask.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-dark dark:text-white">
                  {currentTask.user}
                </h3>
                <p className="text-sm text-text-light dark:text-gray-400">
                  {currentTask.time}
                </p>
              </div>
              <div className="flex items-center space-x-2 ">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(
                    currentTask.urgency
                  )}`}
                >
                  {currentTask.urgency} priority
                </span>
                {Array.isArray(currentTask.helpers) &&
                  currentTask.helpers.length > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {currentTask.helpers.length} helper
                      {currentTask.helpers.length > 1 ? "s" : ""}
                    </span>
                  )}
                <span className="text-lg">
                  {getStatusIcon(currentTask.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">
              {categories.find((c) => c.id === currentTask.category)?.icon}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                categories.find((c) => c.id === currentTask.category)?.color
              }`}
            >
              {categories.find((c) => c.id === currentTask.category)?.name}
            </span>
          </div>

          <h4 className="font-semibold text-text-dark dark:text-white mb-2">
            {currentTask.title}
          </h4>
          <p className="text-text dark:text-gray-300 mb-3">
            {currentTask.description}
          </p>

          <div className="flex items-center text-sm text-text-light dark:text-gray-400 space-x-4 mb-3">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{currentTask.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{currentTask.karma} karma</span>
            </div>
          </div>

          {/* Show helpers if any */}
          {Array.isArray(currentTask.helpers) &&
            currentTask.helpers.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {currentTask.helpers.length} Helper
                    {currentTask.helpers.length > 1 ? "s" : ""}:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentTask.helpers.map((helper, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                        helper.status === "selected"
                          ? "bg-green-100 dark:bg-green-800/30"
                          : helper.status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-800/30"
                          : helper.status === "rejected"
                          ? "bg-red-100 dark:bg-red-800/30"
                          : "bg-gray-100 dark:bg-gray-800/30"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          helper.status === "selected"
                            ? "bg-green-500"
                            : helper.status === "pending"
                            ? "bg-yellow-500"
                            : helper.status === "rejected"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }`}
                      ></span>
                      <span
                        className={
                          helper.status === "selected"
                            ? "text-green-700 dark:text-green-300"
                            : helper.status === "pending"
                            ? "text-yellow-700 dark:text-yellow-300"
                            : helper.status === "rejected"
                            ? "text-red-700 dark:text-red-300"
                            : "text-gray-700 dark:text-gray-300"
                        }
                      >
                        {helper.userId?.name || "Helper"}
                        {helper.status === "selected" && " ✓"}
                        {helper.status === "pending" && " ⏳"}
                        {helper.status === "rejected" && " ✗"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      <div className="border-t border-border dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-text-light dark:text-gray-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              disabled={isLiking}
              className={`flex items-center space-x-1 transition-colors cursor-pointer disabled:opacity-50 ${
                isLikedByUser
                  ? "text-red-500 hover:text-red-600"
                  : "hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${isLikedByUser ? "fill-current" : ""}`}
              />
              <span>{currentTask.likes}</span>
            </button>
            {/* Removed comment section */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHelpersModal(true);
              }}
              className="flex items-center space-x-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>
                {Array.isArray(currentTask.helpers)
                  ? currentTask.helpers.length
                  : 0}{" "}
                helpers
              </span>
            </button>
          </div>

          <div className="flex space-x-2">
            {currentTask.status === "open" &&
              !isUserCreator &&
              !isUserHelping && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcceptTask();
                  }}
                  disabled={isAccepting}
                  className="bg-gradient-to-r from-primary-light to-primary text-background px-4 py-2 rounded-full text-sm font-medium hover:from-primary hover:to-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAccepting ? "Accepting..." : "I can help!"}
                </button>
              )}
            {currentTask.status === "open" && isUserCreator && (
              <button className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-medium cursor-not-allowed">
                Your Task
              </button>
            )}
            {currentTask.status === "open" && isUserHelping && (
              <button className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
                Already Helping
              </button>
            )}
            {currentTask.status === "in_progress" &&
              !isUserCreator &&
              !isSelectedHelper && (
                <button className="bg-status-success-bg text-status-success-text dark:bg-primary-dark dark:hover:bg-primary dark:text-status-success-dark-text px-4 py-2 rounded-full text-sm font-medium">
                  In Progress
                </button>
              )}
            {currentTask.status === "in_progress" &&
              (isUserCreator || isSelectedHelper) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompleteTask();
                  }}
                  disabled={isCompleting}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompleting ? "Completing..." : "Mark Complete"}
                </button>
              )}
            {currentTask.status === "completed" && (
              <button className="bg-status-success-bg text-status-success-text dark:bg-primary-dark dark:hover:bg-primary dark:text-status-success-dark-text px-4 py-2 rounded-full text-sm font-medium">
                Completed ✨
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAcceptTask}
        title="Offer Help"
        message={`Are you sure you want to help with "${currentTask.title}"? This will mark the task as in progress and you'll be able to communicate with the task creator.`}
        confirmText="Yes, I'll Help!"
        cancelText="Cancel"
        type="info"
        isLoading={isAccepting}
      />

      {/* Helpers Modal */}
      <HelpersModal
        isOpen={showHelpersModal}
        onClose={() => setShowHelpersModal(false)}
        task={currentTask}
        onTaskUpdate={(updatedTask) => {
          // Update the current task state
          setCurrentTask(updatedTask);
          // Also call the parent's onTaskUpdate if provided
          if (onTaskUpdate) {
            onTaskUpdate(updatedTask);
          }
        }}
      />
    </div>
  );
};

export default TaskCard;
