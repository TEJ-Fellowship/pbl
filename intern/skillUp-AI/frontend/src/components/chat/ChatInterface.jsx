import { useState } from "react";

const ChatInterface = () => {

    const [request, setRequest] = useState("");
    const [response, setResponse] = useState([]);
  return (
    <div className="flex flex-col h-[500px] w-full max-w-md border rounded-2xl shadow-md p-4">
      {/* Scrollable chat container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        <p className="bg-gray-100 p-2 rounded-lg">
          User: Hello AI 👋
        </p>
        <p className="bg-blue-100 p-2 rounded-lg self-start">
          AI: Hi there! How can I help you today?
        </p>
        <p className="bg-gray-100 p-2 rounded-lg">
          User: Hello AI 👋
        </p>
        <p className="bg-blue-100 p-2 rounded-lg self-start">
          AI: Hi there! How can I help you today?
        </p>
        <p className="bg-gray-100 p-2 rounded-lg">
          User: Tell me a joke 😂
        </p>
      </div>

      {/* Input box */}
      <div className="mt-2 flex">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 border rounded-l-xl px-3 py-2 focus:outline-none"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded-r-xl">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
