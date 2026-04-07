import React from "react";

const ChatInputBar = () => {
  return (
    <div className="relative flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-md w-full max-w-2xl mx-auto mt-[480px]">
      <button
        type="button"
        aria-label="Add attachment"
        className="mr-2 h-6 w-6 rounded-full border border-gray-200 bg-black text-white flex items-center justify-center leading-none transition-colors hover:bg-gray-200 hover:text-black"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>
      <input
        type="text"
        placeholder="Type your message..."
        className="flex-1 bg-transparent pr-12 outline-none"
        aria-label="Message input"
      />
      <button
        type="button"
        aria-label="Send message"
        className="absolute right-2 h-8 w-8 rounded-xl bg-[#516498] text-white flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M12 19V5" />
          <path d="M6 11l6-6 6 6" />
        </svg>
      </button>
    </div>
  );
};

export default ChatInputBar;
