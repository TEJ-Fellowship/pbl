import React, { useState } from "react";
import {
  ChevronLeft,
  Calendar
} from "lucide-react";
import Editor from "../components/Editor";

function Journal() {
  const [selectedEmoji, setSelectedEmoji] = useState("😍");
  const [showEmojiPanel, setShowEmojiPanel] = useState(true);
  const [showMoreEmojis, setShowMoreEmojis] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const emojis = ["😂", "😍", "🔥", "🥰", "😥", "😭", "😠", "😇", "😔", "😃"];

  const moreEmojis = [
    "🤔",
    "😊",
    "😴",
    "🤯",
    "😎",
    "🎉",
    "💪",
    "🌟",
    "❤️",
    "👍",
    "🙄",
    "😤",
    "🤗",
    "😱",
    "🥳",
    "😢",
    "😬",
    "🤩",
    "😌",
    "🙃",
  ];

  const displayEmojis = showMoreEmojis ? [...emojis, ...moreEmojis] : emojis;

  const handleEmojiSelect = (emoji) => {
    setSelectedEmoji(emoji);
    setShowEmojiPanel(false);
    setSelected(true);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.getDate();
  };

  const getMonthYear = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const getDayOfWeek = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between bg-white shadow-lg p-4 rounded-2xl mb-6 border border-gray-100">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
            <ChevronLeft size={18} />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            New Journal Entry
          </h1>
          <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-2 rounded-xl hover:from-green-600 hover:to-emerald-600 active:scale-95 transition-all duration-200 shadow-lg font-medium">
            Save
          </button>
        </div>

        {/* //date section */}
        <div className="bg-white shadow-lg rounded-2xl  flex flex-row justify-between mb-4 p-2 border border-gray-100">
          <div className="flex items-center gap-4 mb-1 ml-4">
            <div className="flex flex-row items-center gap-3">
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
            <div className="flex items-center  mb-1 ">
              <span className="text-2xl">{selectedEmoji}</span>
              <h2 className="text-lg font-medium text-gray-700">
                {selected ? "" : "Select Your Mood"}
              </h2>
              {!showEmojiPanel && (
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
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 border border-purple-200  shadow-2xl mb-2 mt-0">
            <div className="grid grid-cols-5 gap-3 mb-4">
              {displayEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`w-14 h-14 flex items-center justify-center text-2xl rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md ${
                    selectedEmoji === emoji
                      ? "bg-white shadow-lg ring-2 ring-purple-400"
                      : "bg-white/70 hover:bg-white"
                  }`}
                >
                  {emoji}
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
        <Editor title={title} setTitle={setTitle} content={content} setContent={setContent} />

      </div>
    </div>
  );
}

export default Journal;
