import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar";

const AuthLayout = ({ user, onLogout }) => {
  return (
    <div className="app-big-container">
      <Navbar />

      {/* Main Content */}
      <Outlet />
    </div>
  );
};

export default AuthLayout;
