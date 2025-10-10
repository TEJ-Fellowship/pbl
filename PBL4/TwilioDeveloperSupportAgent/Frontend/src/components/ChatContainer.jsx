import React from "react";

const ChatContainer = ({ children }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="h-[calc(100vh-200px)] flex flex-col">{children}</div>
    </div>
  );
};

export default ChatContainer;
