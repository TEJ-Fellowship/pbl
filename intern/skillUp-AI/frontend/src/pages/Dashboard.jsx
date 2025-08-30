// src/pages/Dashboard.jsx
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

const Dashboard = () => {

  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };
  return (
    <>
      <div>
       <button onClick={handleLogout} style={{ float: 'right' }}>Logout</button>

        <p>
          Choose a topic to study :
          <select>
            <option>Select a topic</option>
            <option>JavaScript</option>
            <option>React</option>
            <option>Python</option>
            <option>HTML/CSS</option>
          </select>
        </p>
      </div>
    </>
  );
};

export default Dashboard;
