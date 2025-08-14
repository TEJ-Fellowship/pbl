import React from "react";
import { HandHeart, AlertTriangle, CheckCircle } from "lucide-react";
import Modal from "./Modal";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info", // "info", "warning", "success"
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case "success":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      default:
        return <HandHeart className="w-8 h-8 text-blue-500" />;
    }
  };

  const getButtonColors = () => {
    switch (type) {
      case "warning":
        return "bg-yellow-500 hover:bg-yellow-600 text-white";
      case "success":
        return "bg-green-500 hover:bg-green-600 text-white";
      default:
        return "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">{getIcon()}</div>

        {/* Message */}
        <div>
          <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 ${getButtonColors()}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
