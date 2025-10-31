import React from "react";

const ChatContainer = ({ children, theme = "dark" }) => {
  const isDark = theme === "dark";
  return (
    <div
      className={`h-full flex flex-col ${isDark ? "bg-gray-900" : "bg-white"}`}
    >
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
};

export default ChatContainer;
