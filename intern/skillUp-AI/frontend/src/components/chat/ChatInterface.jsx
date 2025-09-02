import { useState } from "react";
import service from "../../services/service";
const url = import.meta.env.VITE_AI_URL;

const ChatInterface = ({topic, user}) => {
  const [userRequest, setUserRequest] = useState("");
  const [aiResponse, setAiResponse] = useState([]);

    console.log(user.id, "the user id from props ?");

  console.log(userRequest, "the user search is ?");

  const handleRequest = async () => {
    if(!topic){
      return console.log("Select topic first");
    }
    try {

      const result = await service.create(url, {topic, userRequest, user}); 

      if (result) {
        setAiResponse(result.data[0].answer);
        console.log(result.data[0].answer);
      }
    } catch (error) {
      console.log(error, "Error to connect with AI");
    }
  };
          console.log("this is AI response", aiResponse);

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md border rounded-2xl shadow-md p-4">
      {/* Scrollable chat container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        <p className="bg-gray-100 p-2 rounded-lg">User: Hello AI 👋</p>
        <p className="bg-blue-100 p-2 rounded-lg self-start">
          AI: Hi there! How can I help you today?
        </p>
        <p className="bg-gray-100 p-2 rounded-lg">User: Hello AI 👋</p>
        <p className="bg-blue-100 p-2 rounded-lg self-start">
          AI: Hi there! How can I help you today?
        </p>
        <p className="bg-gray-100 p-2 rounded-lg">User: Tell me a joke 😂</p>
      </div>

      {/* Input box */}
      <div className="mt-2 flex">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 border rounded-l-xl px-3 py-2 focus:outline-none"
          value={userRequest}
          onChange={(e) => setUserRequest(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-r-xl"
          onClick={handleRequest}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
