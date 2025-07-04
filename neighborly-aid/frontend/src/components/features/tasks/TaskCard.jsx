import React, { useState, useContext, useEffect } from "react";
import {
  MapPin,
  Star,
  Heart,
  Users,
  CloudCog,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import {
  acceptTask,
  likeTask,
  markTaskAsCompletedByHelper,
  approveTaskCompletion,
  deleteTask,
  cancelTask,
  updateTask,
} from "../../../api/tasks";
import AuthContext from "../../../context/AuthContext";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../../ui/ConfirmationModal";
import HelpersModal from "./HelpersModal";
import EditTaskForm from "./EditTaskForm";

const TaskCard = ({ task, categories, onTaskUpdate }) => {
  const { user } = useContext(AuthContext);
  const [isLiking, setIsLiking] = useState(false);
  const [currentTask, setCurrentTask] = useState(task);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHelpersModal, setShowHelpersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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

  // Status icons remain the same
  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return "🔓";
      case "in_progress":
        return "⏳";
      case "completed":
        return "✅";
      case "awaiting_approval":
        return "⏳";
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

  // Alternative check using selectedHelper field
  const isSelectedHelperAlt =
    currentTask.selectedHelper?._id === user?.id ||
    currentTask.selectedHelper === user?.id;

  // Use either method to determine if user is selected helper
  const isUserSelectedHelper = isSelectedHelper || isSelectedHelperAlt;

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

  const handleHelperCompleteTask = async () => {
    if (!user) {
      toast.error("Please log in to complete tasks");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you have completed "${currentTask.title}"? The requester will need to approve your completion.`
    );

    if (!confirmed) return;

    try {
      const result = await markTaskAsCompletedByHelper(
        currentTask.id || currentTask._id
      );

      // Update the current task state with all the returned data
      setCurrentTask(result);

      if (onTaskUpdate) {
        onTaskUpdate(result);
      }

      toast.success(
        "Task marked as completed! Waiting for requester approval. ⏳"
      );
    } catch (error) {
      console.error("Error marking task as completed:", error);
      const errorMessage = error.error || "Failed to mark task as completed";
      toast.error(errorMessage);
    }
  };

  const handleApproveCompletion = async (approved, notes = "") => {
    if (!user) {
      toast.error("Please log in to approve task completion");
      return;
    }

    const action = approved ? "approve" : "reject";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} the completion of "${currentTask.title}"?`
    );

    if (!confirmed) return;

    try {
      const result = await approveTaskCompletion(
        currentTask.id || currentTask._id,
        approved,
        notes
      );

      // Update the current task state with all the returned data
      setCurrentTask(result);

      if (onTaskUpdate) {
        onTaskUpdate(result);
      }

      if (approved) {
        if (result.karmaTransfer) {
          const { transferredAmount, requester, helper } = result.karmaTransfer;
          toast.success(
            `Task approved! ${transferredAmount} karma points transferred from ${requester.name} to ${helper.name}! 🎉✨`,
            { duration: 5000 }
          );
        } else {
          toast.success("Task approved! Karma points transferred! 🎉");
        }
      } else {
        toast.success("Task completion rejected. Helper can try again. ❌");
      }
    } catch (error) {
      console.error("Error approving task completion:", error);
      const errorMessage = error.error || "Failed to approve task completion";
      toast.error(errorMessage);
    }
  };

  const handleDeleteTask = async () => {
    if (!user) {
      toast.error("Please log in to delete this task");
      return;
    }

    setIsDeleting(true);
    try {
      let result;
      if (currentTask.status === "in_progress") {
        result = await cancelTask(currentTask.id || currentTask._id);
        toast.success(
          `Task cancelled successfully! ${result.refundedKarma} karma points refunded.`
        );
      } else {
        result = await deleteTask(currentTask.id || currentTask._id);
        toast.success(
          `Task deleted successfully! ${result.refundedKarma} karma points refunded.`
        );
      }

      // Call onTaskUpdate to refresh the task list
      if (onTaskUpdate) {
        onTaskUpdate(null); // Pass null to indicate task was deleted/cancelled
      }
    } catch (error) {
      console.error("Error deleting/cancelling task:", error);
      const errorMessage = error.error || "Failed to delete/cancel task";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleUpdateTask = async (updatedData) => {
    if (!user) {
      toast.error("Please log in to update this task");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateTask(
        currentTask.id || currentTask._id,
        updatedData
      );

      // Update the current task state
      setCurrentTask(result);

      // Call onTaskUpdate to refresh the task list
      if (onTaskUpdate) {
        onTaskUpdate(result);
      }

      toast.success("Task updated successfully! ✨");
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating task:", error);
      const errorMessage = error.error || "Failed to update task";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
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
          {/* Category Tag */}
          {currentTask.category && (
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">
                {categories.find((c) => 
                  (c._id === currentTask.category?._id || c._id === currentTask.category)
                )?.icon || '📋'}
              </span>
              <span
                className="px-2 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `${categories.find((c) => 
                    (c._id === currentTask.category?._id || c._id === currentTask.category)
                  )?.color || '#6B7280'}20`,
                  color: categories.find((c) => 
                    (c._id === currentTask.category?._id || c._id === currentTask.category)
                  )?.color || '#6B7280',
                  borderColor: categories.find((c) => 
                    (c._id === currentTask.category?._id || c._id === currentTask.category)
                  )?.color || '#6B7280'
                }}
              >
                {categories.find((c) => 
                  (c._id === currentTask.category?._id || c._id === currentTask.category)
                )?.displayName || categories.find((c) => 
                  (c._id === currentTask.category?._id || c._id === currentTask.category)
                )?.name || 'Uncategorized'}
              </span>
            </div>
          )}

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
              <div className="flex space-x-2">
                <button className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-medium cursor-not-allowed">
                  Your Task
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditModal(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-full text-sm font-medium flex items-center space-x-1"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-full text-sm font-medium flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
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
            {currentTask.status === "in_progress" && isUserCreator && (
              <div className="flex space-x-2">
                <button className="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300 px-4 py-2 rounded-full text-sm font-medium">
                  In Progress
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-full text-sm font-medium flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
            {currentTask.status === "in_progress" &&
              isUserSelectedHelper &&
              !currentTask.helperMarkedComplete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHelperCompleteTask();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium"
                >
                  Mark as Completed
                </button>
              )}
            {currentTask.helperMarkedComplete &&
              isUserCreator &&
              (currentTask.requesterApproved === null ||
                currentTask.requesterApproved === undefined) && (
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApproveCompletion(true);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium"
                  >
                    Approve ✅
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApproveCompletion(false);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium"
                  >
                    Reject ❌
                  </button>
                </div>
              )}
            {currentTask.helperMarkedComplete &&
              !isUserCreator &&
              currentTask.requesterApproved === null && (
                <button className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Waiting for Approval ⏳
                </button>
              )}
            {currentTask.status === "completed" && (
              <button className="bg-status-success-bg text-status-success-text dark:bg-primary-dark dark:hover:bg-primary dark:text-status-success-dark-text px-4 py-2 rounded-full text-sm font-medium">
                Completed ✨
              </button>
            )}
            {currentTask.status === "awaiting_approval" && isUserCreator && (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApproveCompletion(true);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium"
                >
                  Approve ✅
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApproveCompletion(false);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium"
                >
                  Reject ❌
                </button>
              </div>
            )}
            {currentTask.status === "awaiting_approval" &&
              isUserSelectedHelper && (
                <button className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Waiting for Approval ⏳
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteTask}
        title={
          currentTask.status === "in_progress" ? "Cancel Task" : "Delete Task"
        }
        message={`Are you sure you want to ${
          currentTask.status === "in_progress" ? "cancel" : "delete"
        } "${
          currentTask.title
        }"? This action cannot be undone and you will receive a refund of ${
          currentTask.karma
        } karma points.`}
        confirmText={
          currentTask.status === "in_progress"
            ? "Yes, Cancel Task"
            : "Yes, Delete Task"
        }
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit Task
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <EditTaskForm
                task={currentTask}
                categories={categories}
                onUpdate={handleUpdateTask}
                onCancel={() => setShowEditModal(false)}
                isLoading={isUpdating}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
