import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, Calendar } from "lucide-react";
import Editor from "../components/Editor";
import emojis from "../emojis";
import moreEmojis from "../moreEmojis";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Content from "./Content";
function EditJournalModal({
  journal,
  onClose,
  onUpdate,
  journals,
  setJournals,
}) {
  const editorRef = useRef();
  const navigate = useNavigate();

  // Initialize state with journal data
  const [selectedEmoji, setSelectedEmoji] = useState(journal.mood || {});
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showMoreEmojis, setShowMoreEmojis] = useState(false);
  const [title, setTitle] = useState(journal.title || "");
  const [content, setContent] = useState(journal.content || "");
  const [selected, setSelected] = useState(!!journal.mood);
  const [selectedDate, setSelectedDate] = useState(
    journal.createdAt
      ? new Date(journal.createdAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );

  const displayEmojis = showMoreEmojis ? [...emojis, ...moreEmojis] : emojis;

  // Set editor content when component mounts
  useEffect(() => {
    if (editorRef.current && content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleEmojiSelect = (symbol) => {
    setSelectedEmoji(symbol);
    setShowEmojiPanel(false);
    setSelected(true);
  };

  const formatDate = (dateStr) => new Date(dateStr).getDate();
  const getMonthYear = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  const getDayOfWeek = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const decoded = jwtDecode(token);
      const userId = decoded.id;
      // Get the journal ID (backend uses 'id')
      const journalId = journal.id;

      // Log the journal ID we're trying to update

      // Get content from editor ref to ensure we have the latest content
      const currentContent = editorRef.current
        ? editorRef.current.innerHTML
        : content;

      const updatedJournal = {
        title,
        content: currentContent,
        mood: selectedEmoji,
        userId,
        createdAt: selectedDate,
      };


      const response = await axios.put(
        `http://localhost:3001/api/journals/${journalId}`,
        updatedJournal,
        { headers: { Authorization: `Bearer ${token}` } }
      );


      if (!response.data) {
        throw new Error("No data received from server");
      }

      // Get the updated journal data from the response
      const updatedJournalData = response.data.journal;

      // Make sure we have all the required data
      const fullUpdatedJournal = {
        ...updatedJournalData,
        id: journalId,
        title,
        content: currentContent,
        mood: selectedEmoji,
        createdAt: selectedDate,
      };


      setJournals((prevJournals) =>
        prevJournals.map((j) => (j.id === journalId ? fullUpdatedJournal : j))
      );

      if (onUpdate) {
        onUpdate(fullUpdatedJournal);
      }

      alert("Journal updated successfully!");
      onClose();
    } catch (err) {
      alert("Failed to update journal. Please try again.");
    }
  };

  const handleCancel = () => onClose();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-white shadow-lg p-4 rounded-2xl mb-6 border border-gray-100">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft size={18} />
              <span className="font-medium">Cancel</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              Edit Journal Entry
            </h1>
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all duration-200 shadow-lg font-medium"
              onClick={handleUpdate}
            >
              Update
            </button>
          </div>

          {/* Date Section */}
          <div className="bg-white shadow-lg rounded-2xl flex justify-between mb-4 p-2 border border-gray-100">
            <div className="flex items-center gap-4 mb-1 ml-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl font-bold text-purple-600">
                  {formatDate(selectedDate)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 font-medium">
                    {getMonthYear(selectedDate)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {getDayOfWeek(selectedDate)}
                  </span>
                </div>
              </div>
              <div className="relative">
                <Calendar className="text-gray-400" size={20} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="mb-2 pt-2 mr-5">
              <div className="flex items-center mb-1">
                <span className="text-2xl">
                  {selectedEmoji.symbol} {selectedEmoji.label}
                </span>
                <h2 className="text-lg font-medium text-gray-700">
                  {selected ? "" : "Select Your Mood"}
                </h2>
                {!showEmojiPanel && selected && (
                  <button
                    onClick={() => setShowEmojiPanel(true)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium ml-2"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mood Section */}
          {showEmojiPanel && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 border border-purple-200 shadow-2xl mb-2 mt-0">
              <div className="grid grid-cols-5 gap-3 mb-4">
                {displayEmojis.map((emojiObj, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelect(emojiObj)}
                    className={`w-14 h-14 flex items-center justify-center text-2xl rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md ${
                      selectedEmoji.symbol === emojiObj.symbol
                        ? "bg-white shadow-lg ring-2 ring-purple-400"
                        : "bg-white/70 hover:bg-white"
                    }`}
                    title={emojiObj.label}
                  >
                    {emojiObj.symbol}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setShowMoreEmojis(!showMoreEmojis)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium px-3 py-1 rounded-lg hover:bg-white/50 transition-colors"
                >
                  {showMoreEmojis ? "Show Less" : "More"}
                </button>
                <button
                  onClick={() => setShowEmojiPanel(false)}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium px-3 py-1 rounded-lg hover:bg-white/50 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Editor */}
          <Content
            title={title}
            setTitle={setTitle}
            content={content}
            setContent={setContent}
            handleSave={handleUpdate}
            editorRef={editorRef}
          />
        </div>
      </div>
    </div>
  );
}

export default EditJournalModal;
