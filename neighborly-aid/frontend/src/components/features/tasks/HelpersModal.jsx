import React, { useState, useContext } from "react";
import {
  Users,
  Clock,
  CheckCircle,
  User,
  Star,
  MapPin,
  Check,
} from "lucide-react";
import Modal from "../../ui/Modal";
import AuthContext from "../../../context/AuthContext";
import { toast } from "react-hot-toast";
import {
  removeHelp,
  acceptTask,
  selectHelper,
  approveTaskCompletion,
} from "../../../api/tasks";

const HelpersModal = ({ isOpen, onClose, task, onTaskUpdate }) => {
  const { user } = useContext(AuthContext);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  if (!task) return null;

  const helpers = Array.isArray(task.helpers) ? task.helpers : [];
  const isUserCreator =
    task.createdBy?._id === user?.id || task.createdBy === user?.id;
  const isUserHelping = helpers.some(
    (helper) => helper.userId?._id === user?.id || helper.userId === user?.id
  );

  // Filter helpers by status
  const pendingHelpers = helpers.filter(
    (helper) => helper.status === "pending"
  );
  const selectedHelper = helpers.find((helper) => helper.status === "selected");

  const handleRemoveHelp = async () => {
    if (!user) {
      toast.error("Please log in to remove your help");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to stop helping with this task?"
    );

    if (!confirmed) return;

    setIsRemoving(true);
    try {
      const result = await removeHelp(task.id || task._id);

      toast.success("You've stopped helping with this task");
      if (onTaskUpdate) {
        onTaskUpdate(result);
      }
      onClose();
    } catch (error) {
      console.error("Error removing help:", error);
      toast.error("Failed to remove help");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAcceptTask = async () => {
    if (!user) {
      toast.error("Please log in to help with tasks");
      return;
    }

    setIsAccepting(true);
    try {
      const result = await acceptTask(task.id || task._id);

      toast.success("You're now helping with this task! 🎉");
      if (onTaskUpdate) {
        onTaskUpdate(result);
      }
      onClose();
    } catch (error) {
      console.error("Error accepting task:", error);
      toast.error(error.error || "Failed to accept task");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSelectHelper = async (helperId) => {
    if (!user) {
      toast.error("Please log in to select helpers");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to select this helper? This will mark the task as in progress and notify the selected helper."
    );

    if (!confirmed) return;

    setIsSelecting(true);
    try {
      const result = await selectHelper(task.id || task._id, helperId);

      toast.success(
        "Helper selected successfully! The task is now in progress."
      );
      if (onTaskUpdate) {
        onTaskUpdate(result);
      }
      onClose();
    } catch (error) {
      console.error("Error selecting helper:", error);
      toast.error(error.error || "Failed to select helper");
    } finally {
      setIsSelecting(false);
    }
  };

  const handleApproveCompletion = async (approved, notes = "") => {
    if (!user) {
      toast.error("Please log in to approve task completion");
      return;
    }

    const action = approved ? "approve" : "reject";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} the completion of "${task.title}"?`
    );

    if (!confirmed) return;

    setIsApproving(true);
    try {
      const result = await approveTaskCompletion(
        task.id || task._id,
        approved,
        notes
      );

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
      onClose();
    } catch (error) {
      console.error("Error approving task completion:", error);
      const errorMessage = error.error || "Failed to approve task completion";
      toast.error(errorMessage);
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "selected":
        return "text-green-600 dark:text-green-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "rejected":
        return "text-red-600 dark:text-red-400";
      case "completed":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "selected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <Clock className="w-4 h-4 text-red-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "selected":
        return "Selected";
      case "pending":
        return "Waiting for selection";
      case "rejected":
        return "Not selected";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Helpers for "${task.title}"`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Task Info */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {task.category?.charAt(0)?.toUpperCase() || "T"}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {task.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {task.description}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{task.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3" />
                  <span>{task.taskKarmaPoints || 10} karma</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === "open"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : task.status === "in_progress"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                }`}
              >
                {task.status}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Helper Section */}
        {selectedHelper && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Selected Helper
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  {selectedHelper.userId?.name || "Helper"}
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Selected on{" "}
                  {formatDate(
                    selectedHelper.selectedAt || selectedHelper.acceptedAt
                  )}
                </p>
                {/* Show completion status */}
                {task.helperMarkedComplete && (
                  <div className="mt-2">
                    {task.requesterApproved === null ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        ⏳ Waiting for approval
                      </span>
                    ) : task.requesterApproved === true ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        ✅ Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        ❌ Rejected
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending Helpers Section */}
        {isUserCreator && pendingHelpers.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Choose a Helper ({pendingHelpers.length} available)
              </h3>
            </div>
            <div className="space-y-3">
              {pendingHelpers.map((helper, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {helper.userId?.name || "Helper"}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon(helper.status)}
                        <span
                          className={`text-sm ${getStatusColor(helper.status)}`}
                        >
                          {getStatusText(helper.status)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Offered help on {formatDate(helper.acceptedAt)}
                      </p>
                      {helper.userId?.karmaPoints && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Karma: {helper.userId.karmaPoints} • Completed tasks:{" "}
                          {helper.userId.completedTasks || 0}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Select Helper Button */}
                  <button
                    onClick={() =>
                      handleSelectHelper(helper.userId._id || helper.userId)
                    }
                    disabled={isSelecting}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isSelecting ? "Selecting..." : "Select Helper"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Helpers List (for non-creators or when no pending helpers) */}
        {(!isUserCreator || pendingHelpers.length === 0) && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {helpers.length} Helper{helpers.length !== 1 ? "s" : ""}
              </h3>
            </div>

            {helpers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">
                  No helpers yet. Be the first to offer help!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {helpers.map((helper, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {helper.userId?.name || "Helper"}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(helper.status)}
                          <span
                            className={`text-sm ${getStatusColor(
                              helper.status
                            )}`}
                          >
                            {getStatusText(helper.status)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {helper.status === "selected"
                            ? "Selected on"
                            : "Offered help on"}{" "}
                          {formatDate(helper.selectedAt || helper.acceptedAt)}
                        </p>
                        {helper.userId?.karmaPoints && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Karma: {helper.userId.karmaPoints} • Completed
                            tasks: {helper.userId.completedTasks || 0}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2">
                      {helper.userId?._id === user?.id &&
                        helper.status === "pending" && (
                          <button
                            onClick={handleRemoveHelp}
                            disabled={isRemoving}
                            className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                          >
                            {isRemoving ? "Removing..." : "Stop Helping"}
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons for current user */}
        {!isUserCreator && !isUserHelping && task.status === "open" && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <button
              onClick={handleAcceptTask}
              disabled={isAccepting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAccepting ? "Accepting..." : "I Want to Help!"}
            </button>
          </div>
        )}

        {/* Approval buttons for task creator */}
        {isUserCreator &&
          task.helperMarkedComplete &&
          task.requesterApproved === null && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex space-x-3">
                <button
                  onClick={() => handleApproveCompletion(true)}
                  disabled={isApproving}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApproving ? "Approving..." : "Approve ✅"}
                </button>
                <button
                  onClick={() => handleApproveCompletion(false)}
                  disabled={isApproving}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApproving ? "Rejecting..." : "Reject ❌"}
                </button>
              </div>
            </div>
          )}
      </div>
    </Modal>
  );
};

export default HelpersModal;
