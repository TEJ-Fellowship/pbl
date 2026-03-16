import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const AuthLayout = () => {
  return (
    <>
      <div className="min-h-screen w-[60vw] mx-auto mt-4 p-[50px] bg-background-light dark:bg-background-middleDark rounded-2xl shadow-custom transition-colors duration-200">
        <Navbar />
        <Outlet />
      </div>
    </>
  );
};

export default AuthLayout;
