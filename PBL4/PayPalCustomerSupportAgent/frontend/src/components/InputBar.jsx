import { useState } from "react";

const InputBar = ({ onSend }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="flex items-center bg-white p-3 border-t border-gray-300">
      <input
        type="text"
        placeholder="Type your message..."
        className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-paypalBlue"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyPress}
      />
      <button
        className="ml-3 bg-paypalBlue text-white px-4 py-2 rounded-full hover:bg-blue-700"
        onClick={handleSend}
      >
        Send
      </button>
    </div>
  );
};

export default InputBar;
