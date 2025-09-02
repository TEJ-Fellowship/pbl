// src/pages/Dashboard.jsx
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import Logout from "../components/Auth/Logout.jsx";
import ChatInterface from "../components/chat/ChatInterface.jsx";
import ChatHistory from "../components/chat/ChatHistory.jsx";
import { useState } from "react";

// import { useLocation } from "react-router-dom";

const Dashboard = () => {
  const [topic, setTopic] = useState("");
  console.log("selected topic ",topic);

  // const location = useLocation();
  // const user = location.state?.user;
  const { setIsAuthenticated, user } = useContext(AuthContext);
  console.log("log name ", user.fullName);
  return (
    <>
      <div className="flex gap-x-7">
        <div className="w-1/4">
          <ChatHistory user={user} />
        </div>
        <div>
          <div className="right-0">
            <Logout setIsAuthenticated={setIsAuthenticated} />
          </div>
          <div>
            <p>
              Choose a topic to study :
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">Select a topic</option>
                <option value="JavaScript">JavaScript</option>
                <option value="React">React</option>
                <option value="Python">Python</option>
                <option value="HTML/CSS">HTML/CSS</option>
              </select>
            </p>
          </div>
          <ChatInterface  topic={topic} user={user}/>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
