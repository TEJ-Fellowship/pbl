import { X } from "lucide-react";
function EventModal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose?.()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="text-lg font-semibold text-slate-800 ">{title}</h2>
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
