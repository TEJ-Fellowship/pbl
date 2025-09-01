
import React, { useState } from "react";
import { X, Trash2, Edit } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EditJournalModal from "./EditJournalModal";

function JournalReadCard({
  journal,
  onClose,
  onUpdate,
  journals,
  setJournals,
}) {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this journal?"
    );
    if (!isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const journalId = journal._id || journal.id; // make sure ID works

      const response = await axios.delete(
        `http://localhost:3001/api/journals/${journalId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // update parent state
      setJournals((prevJournals) =>
        prevJournals.filter((j) => j._id !== journalId && j.id !== journalId)
      );

      onClose();
      if (response.status === 200) {
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting journal:", error);
      alert("Failed to delete journal. Please try again.");
    }
  };

  const handleEdit = () => setShowEditModal(true);
  const handleEditModalClose = () => setShowEditModal(false);
  const handleEditUpdate = (updatedJournal) => {
    // Update both the journals list and notify parent of update
    if (onUpdate) {
      onUpdate(updatedJournal);
    }
    // Close the edit modal
    setShowEditModal(false);
  };

  return (
    <>
      {!showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold">📝 {journal.title}</h3>
                <p className="text-gray-500">{journal.createdAt}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Edit */}
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Edit size={16} /> Edit
                </button>

                {/* Delete */}
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={16} /> Delete
                </button>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-gray-50 min-h-[300px]">
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: journal.content || journal.htmlContent || "",
                }}
                style={{
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && (
        <EditJournalModal
          journal={journal}
          onClose={handleEditModalClose}
          onUpdate={handleEditUpdate}
          journals={journals}
          setJournals={setJournals}
        />
      )}
    </>
  );
}

export default JournalReadCard;

