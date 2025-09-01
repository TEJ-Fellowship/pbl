// src/pages/Dashboard.jsx
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import Logout from "../components/Auth/Logout.jsx";
import TopicSelector from "../components/chat/TopicSelector.jsx";
import ChatInterface from "../components/chat/ChatInterface.jsx";
import ChatHistory from "../components/chat/ChatHistory.jsx";
// import { useLocation } from "react-router-dom";

const Dashboard = () => {

  // const location = useLocation();
  // const user = location.state?.user;
  const { setIsAuthenticated, user } = useContext(AuthContext);
  console.log("log name ", user.fullName)
  return (
    <>
      <div className="flex gap-x-7" >
        <div className="w-1/4">
          <ChatHistory  user={user}/>
        </div>
        <div >
          <div className="right-0">
          <Logout setIsAuthenticated={setIsAuthenticated} />
          </div>
          <TopicSelector />
          <ChatInterface />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
