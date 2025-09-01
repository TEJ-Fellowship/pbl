import React, { useContext, useState } from "react";
import { ChevronLeft, Calendar, Hand } from "lucide-react";
import Editor from "../components/Editor";
import emojis from "../emojis";
import moreEmojis from "../moreEmojis";
import axios from "axios";
import { ThemeContext } from "../ThemeContext";
import  jwtDecode  from "jwt-decode";
import { useNavigate } from "react-router-dom";

function Journal() {
  const {isDark} = useContext(ThemeContext)
  const editorRef = React.useRef();
  const navigate=useNavigate()
  const [selectedEmoji, setSelectedEmoji] = useState({});
  const [showEmojiPanel, setShowEmojiPanel] = useState(true);
  const [showMoreEmojis, setShowMoreEmojis] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState(false);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const displayEmojis = showMoreEmojis ? [...emojis, ...moreEmojis] : emojis;

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

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const decoded = jwtDecode(token);
      const userId = decoded.id;

      const newJournal = {
        title,
        content,
        mood: selectedEmoji, // { symbol: "😂", label: "happy" }
        userId,
        createdAt: selectedDate,
      };

      const response = await axios.post(
        "http://localhost:3001/api/journals",
        newJournal,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      
      if (editorRef.current) editorRef.current.innerHTML = "";
      setContent("");
      setTitle("");
      setSelectedEmoji({});
      setSelected(false);
      setShowEmojiPanel(true);
      alert("Journal saved successfully!");
      navigate('/')
    } catch (err) {
      console.error("Error saving journal:", err);
    }
  };

  return (
    <div className={`min-h-screen ${isDark?'bg-gradient-to-br from-gray-900 via-gray-600 to-gray-900':'bg-gradient-to-br from-purple-50 to-pink-50'} p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={`flex items-center justify-between {isDark?bg-gray-600:bg-white} shadow-lg p-4 rounded-2xl mb-6 border border-gray-100`}>
          <button className={`flex items-center gap-2 ${isDark?'text-gray-200 hover:text-gray-300':`text-gray-600 hover:text-gray-800`} transition-colors`}>
            <ChevronLeft size={18} />
            <span className="font-medium">Back</span>
          </button>
          <h1 className={`text-lg font-semibold ${isDark?'text-gray-200':'text-gray-800'}`}>
            New Journal Entry
          </h1>
          <button
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-2 rounded-xl hover:from-green-600 hover:to-emerald-600 active:scale-95 transition-all duration-200 shadow-lg font-medium "
            onClick={handleSave}
          >
            Save
          </button>
        </div>

        {/* Date Section */}
        <div className={`${isDark?'bg-gray-600':'bg-white'} shadow-lg rounded-2xl flex justify-between mb-4 p-2 border border-gray-100`}>
          <div className="flex items-center gap-4 mb-1 ml-4">
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${isDark?'text-[#63C8FF]':'text-purple-600'}`}>
                {formatDate(selectedDate)}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm ${isDark?'text-gray-200':'text-gray-500'} font-medium`}>
                  {getMonthYear(selectedDate)}
                </span>
                <span className={`text-sm ${isDark?'text-gray-200':'text-gray-500'}`}>
                  {getDayOfWeek(selectedDate)}
                </span>
              </div>
            </div>
            <div className="relative">
              <Calendar className={isDark?'text-gray-200':'text-gray-500'} size={20} />
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
              <h2 className={`text-lg font-medium ${isDark?'text-gray-200':'text-gray-700'}`}>
                {selected ? "" : "Select Your Mood"}
              </h2>
              {!showEmojiPanel && (
                <button
                  onClick={() => setShowEmojiPanel(true)}
                  className={`text-sm ${isDark?'text-gray-200':'text-purple-600 hover:text-purple-700'} font-medium ml-2`}
                >
                  Change
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mood Section */}
        {showEmojiPanel && (
          <div className={`${isDark?'bg-gradient-to-r from-gray-500 to gray-900' : 'bg-gradient-to-r from-purple-100 to-pink-100'} rounded-2xl p-4 border border-purple-200 shadow-2xl mb-2 mt-0`}>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {displayEmojis.map((emojiObj, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiSelect(emojiObj)}
                  className={`w-14 h-14 flex items-center justify-center text-2xl rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md ${
                    selectedEmoji === emojiObj.symbol
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
                className={`text-sm ${isDark?`text-yellow-300 hover:text-yellow-700`:'text-purple-600 hover:text-purple-700'} font-medium px-3 py-1 rounded-lg hover:bg-white/50 transition-colors`}
              >
                {showMoreEmojis ? "Show Less" : "More"}
              </button>
              <button
                onClick={() => setShowEmojiPanel(false)}
                className={`text-sm  ${isDark?'text-[#AE75DA] hover:text-gray-800':'text-gray-600 hover:text-gray-800'} font-bold px-3 py-1 rounded-lg hover:bg-white/50 transition-colors`}
              >
                Done
              </button>
            </div>
          </div>
        )}

        <Editor
          title={title}
          setTitle={setTitle}
          content={content}
          setContent={setContent}
          handleSave={handleSave}
          editorRef={editorRef}
        />
      </div>
    </div>
  );
}

export default Journal;
