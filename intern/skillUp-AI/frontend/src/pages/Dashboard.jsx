// src/pages/Dashboard.jsx
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import Logout from "../components/Auth/Logout.jsx";
import TopicSelector from "../components/chat/TopicSelector.jsx";
import ChatInterface from "../components/chat/ChatInterface.jsx";

const Dashboard = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  return (
    <>
      <Logout setIsAuthenticated={setIsAuthenticated} />
      <TopicSelector />
      <ChatInterface />
    </>
  );
};

export default Dashboard;
