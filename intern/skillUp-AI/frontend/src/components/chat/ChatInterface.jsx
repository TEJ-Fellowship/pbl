import { useState } from "react";
import service from "../../services/service";
const url = import.meta.env.VITE_AI_URL;

const ChatInterface = ({ topic, user }) => {
  const [userRequest, setUserRequest] = useState("");
  const [aiResponse, setAiResponse] = useState([]);

  console.log(user.id, "the user id from props ?");
  console.log(userRequest, "the user search is ?");

  const handleRequest = async () => {
    if (!topic) {
      return console.log("Select topic first");
    }
    try {
      const result = await service.create(url, { topic, userRequest, user });

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
    <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 relative overflow-hidden">
      {/* Decorative elements - same as login */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"></div>
      <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 rounded-full blur-xl"></div>

      <div className="flex flex-col h-[600px] p-6 relative z-10">
        {/* Chat Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-1">
            AI Chat Assistant
          </h3>
          <p className="text-slate-300 text-sm">
            {topic ? `Learning ${topic}` : "Select a topic to start chatting"}
          </p>
        </div>

        {/* Scrollable chat container - Only this area scrolls //  scrollbar-thin scrollbar-thumb-violet-400/50 scrollbar-track-slate-700/50*/}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4  custom-scrollbar">
          {/* Sample messages with improved styling */}
          <div className="flex justify-end">
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 p-3 rounded-xl max-w-xs relative overflow-hidden">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 via-violet-400/5 to-fuchsia-400/5"></div>
              <p className="text-slate-200 relative z-10">User: Hello AI 👋</p>
            </div>
          </div>
          
          <div className="flex justify-start">
            <div className="bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 backdrop-blur-sm border border-violet-400/30 p-3 rounded-xl max-w-xs relative overflow-hidden">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 via-violet-400/5 to-fuchsia-400/5"></div>
              <p className="text-slate-200 relative z-10">AI: Hi there! How can I help you today?</p>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 p-3 rounded-xl max-w-xs relative overflow-hidden">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 via-violet-400/5 to-fuchsia-400/5"></div>
              <p className="text-slate-200 relative z-10">User: Tell me about {topic || 'programming'}</p>
            </div>
          </div>

          <div className="flex justify-start">
            <div className="bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 backdrop-blur-sm border border-violet-400/30 p-3 rounded-xl max-w-xs relative overflow-hidden">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 via-violet-400/5 to-fuchsia-400/5"></div>
              <p className="text-slate-200 relative z-10">
                {aiResponse || `I'd be happy to help you learn about ${topic || 'programming'}! What specific aspect would you like to explore?`}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 p-3 rounded-xl max-w-xs relative overflow-hidden">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 via-violet-400/5 to-fuchsia-400/5"></div>
              <p className="text-slate-200 relative z-10">User: Tell me a joke 😂</p>
            </div>
          </div>

          {/* Add more messages to demonstrate scrolling */}
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num}>
              <div className="flex justify-end mb-3">
                <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 p-3 rounded-xl max-w-xs relative overflow-hidden">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 via-violet-400/5 to-fuchsia-400/5"></div>
                  <p className="text-slate-200 relative z-10">User: Question {num}</p>
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 backdrop-blur-sm border border-violet-400/30 p-3 rounded-xl max-w-xs relative overflow-hidden">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 via-violet-400/5 to-fuchsia-400/5"></div>
                  <p className="text-slate-200 relative z-10">AI: Answer {num} - This is a longer response to show how the chat scrolling works properly.</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input box with matching style */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full px-4 py-3 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400/50 transition-all duration-300 placeholder-slate-400 text-white hover:bg-slate-700/70 hover:border-slate-500/50"
              value={userRequest}
              onChange={(e) => setUserRequest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRequest()}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 via-violet-400/5 to-fuchsia-400/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
          <button
            className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 hover:from-cyan-600 hover:via-violet-600 hover:to-fuchsia-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-violet-400/50 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-xl transform hover:scale-105 hover:shadow-2xl group"
            onClick={handleRequest}
          >
            <span className="relative z-10">Send</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;