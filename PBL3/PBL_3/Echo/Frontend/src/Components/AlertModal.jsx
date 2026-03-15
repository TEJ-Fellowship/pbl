import React, { useEffect } from "react";

const AlertModal = ({ isOpen, onClose, message, type = "info" }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  const gradients = {
    info: "from-indigo-600 to-purple-600",
    success: "from-green-500 to-teal-500",
    warning: "from-yellow-500 to-orange-500",
    error: "from-red-500 to-pink-500",
  };

  return (
    <div className="fixed inset-x-0 top-4 z-[9999] flex justify-center px-4">
      <div
        className={`w-full max-w-lg bg-gradient-to-r ${gradients[type]} text-white rounded-xl shadow-lg p-4 flex items-center justify-between animate-slideDown`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icons[type]}</span>
          <p className="text-base font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
