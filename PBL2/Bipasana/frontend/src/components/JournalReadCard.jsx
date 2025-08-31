import React from "react";
import { X, Trash2, Edit } from "lucide-react";

function JournalReadCard({ journal, onClose, onDelete, onUpdate }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        
        {/* Header with title, date and buttons */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold">📝{journal.title}</h3>
            <p className="text-gray-500">{journal.date}</p>
          </div>
          <div className="flex items-center gap-3">

            {/* Update Button */}
            <button
              onClick={onUpdate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit size={16} /> Update
            </button>

            {/* Delete Button */}
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} /> Delete
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 bg-gray-50 min-h-[300px]">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {journal.content}
          </p>
        </div>
      </div>
    </div>
  );
}

export default JournalReadCard;