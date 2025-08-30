import React, { useState, useRef } from 'react';
import { Bold, Italic, Underline, List, Quote, Image, Link, Smile, MoreHorizontal} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function JournalEntry() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const editorRef = useRef();

  const moods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😍', label: 'Love' },
    { emoji: '🔥', label: 'Excited' },
    { emoji: '🤩', label: 'Amazing' },
    { emoji: '😅', label: 'Nervous' },
    { emoji: '🎁', label: 'Grateful' },
    { emoji: '🤯', label: 'Mind-blown' },
    { emoji: '🧡', label: 'Loved' },
    { emoji: '😌', label: 'Peaceful' },
    { emoji: '🤪', label: 'Silly' }
  ];

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  const formatText = (command) => {
    document.execCommand(command, false, null);
    editorRef.current.focus();
  };

  const handleSave = () => {
    const content = editorRef.current.innerHTML;
    console.log('Saving journal entry:', {
      date,
      selectedMood,
      title,
      content,
    });
    alert('Journal entry saved!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-pink-200 to-purple-300">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white/50 backdrop-blur-md rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800">New Journal Entry</h1>
            <button
              onClick={handleSave}
              className="bg-[#BF40BF] hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Date Input */}
        <div className="mb-6">
        <DatePicker
            selected={date}
            onChange={(date) => setDate(date)}
            dateFormat="MMMM d, yyyy"
            placeholderText="Select a date"
            className="bg-gradient-to-br from-purple-700 to-gray-400 border border-gray-200 rounded-lg px-4 py-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-yellow-100"
        />
        </div>

        {/* Mood Selection */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-lg mr-2">😊</span>
            <h2 className="text-lg font-medium text-gray-800">How was your day?</h2>
          </div>

          <div className="bg-gradient-to-r from-purple-400 to-purple-500 rounded-2xl p-6">
            <div className="grid grid-cols-5 gap-4">
              {moods.map((mood, index) => (
                <button
                  key={index}
                  onClick={() => handleMoodSelect(mood)}
                  className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-2xl hover:scale-105 transition-transform ${
                    selectedMood?.emoji === mood.emoji
                      ? 'ring-4 ring-white ring-opacity-50 scale-105'
                      : ''
                  }`}
                  title={mood.label}
                >
                  {mood.emoji}
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <button className="text-white text-sm flex items-center hover:underline">
                More
                <MoreHorizontal className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Mood Display */}
        {selectedMood && (
          <div className="mt-4 flex items-center text-gray-600">
            <span className="text-lg mr-2">{selectedMood.emoji}</span>
            <span className="text-sm">Feeling {selectedMood.label.toLowerCase()}</span>
          </div>
        )}

        {/* Title Input */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Add a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl font-light font-kaushan text-gray-800 placeholder-[#BF40BF] bg-transparent border border-gray-500 rounded-lg text-black py-3 px-2 transition-transform duration-300 ease-in-out
            hover:-translate-y-1 hover:shadow-lg"
          />
        </div>

        {/* Rich Text Toolbar */}
        <div className="mb-4">
          <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg border">
            <button
              onClick={() => formatText('bold')}
              className="p-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              onClick={() => formatText('italic')}
              className="p-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>

            <button
              onClick={() => formatText('underline')}
              className="p-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors"
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            <button className="px-3 py-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium">
              H1
            </button>

            <button className="px-3 py-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium">
              H2
            </button>

            <button className="px-3 py-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium">
              H3
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            <button
              onClick={() => formatText('insertUnorderedList')}
              className="p-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>

            <button className="px-3 py-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors text-sm">
              1.List
            </button>

            <button className="px-3 py-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center">
              <Quote className="w-4 h-4 mr-1" />
              Quote
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            <button className="p-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors flex items-center text-sm">
              <Image className="w-4 h-4 mr-1" />
              Image
            </button>

            <button className="p-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors flex items-center text-sm">
              <Link className="w-4 h-4 mr-1" />
              Link
            </button>

            <button className="p-2 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors flex items-center text-sm">
              <Smile className="w-4 h-4 mr-1" />
              Emoji
            </button>
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-white rounded-lg border min-h-96">
          <div
            ref={editorRef}
            contentEditable
            className="font-merriweather w-full min-h-96 p-6 text-gray-600 bg-white rounded-lg border border-gray-300 outline-none leading-relaxed text-base"
            placeholder="Write your thoughts here..."
            suppressContentEditableWarning={true}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default JournalEntry;
