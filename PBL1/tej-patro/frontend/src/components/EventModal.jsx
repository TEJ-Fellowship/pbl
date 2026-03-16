import { useEffect } from "react";
import { X } from "lucide-react";

function EventModal({ title, onClose, children }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "event-modal-title" : undefined}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2
              id="event-modal-title"
              className="text-lg font-semibold text-slate-800 mb-4"
            >
              {title}
            </h2>
          )}
          {!title && <span />}
          <button
            className="text-slate-500 hover:text-slate-700"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="rounded p-1 border border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-500 hover:bg-slate-100" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default EventModal;
