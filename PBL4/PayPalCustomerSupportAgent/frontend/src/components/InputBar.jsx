import { useState } from "react";

const InputBar = ({ onSend }) => {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const handleSend = () => {
    if (!text.trim()) {
      setError("Please enter a message.");
      return;
    }
    onSend(text);
    setText("");
    setError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="flex items-center bg-white p-3 border-t border-gray-300">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Type your message..."
          className={`w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-paypalBlue ${
            error ? "border-red-400" : "border-gray-300"
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? "input-error" : undefined}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error && e.target.value.trim()) setError("");
          }}
          onKeyDown={handleKeyPress}
        />
        {error && (
          <div id="input-error" className="mt-1 text-xs text-red-600 px-2">
            {error}
          </div>
        )}
      </div>
      <button
        className={`ml-3 px-4 py-2 rounded-full text-white ${
          text.trim()
            ? "bg-paypalBlue hover:bg-blue-700"
            : "bg-gray-300 cursor-not-allowed"
        }`}
        onClick={handleSend}
        disabled={!text.trim()}
      >
        Send
      </button>
    </div>
  );
};

export default InputBar;
