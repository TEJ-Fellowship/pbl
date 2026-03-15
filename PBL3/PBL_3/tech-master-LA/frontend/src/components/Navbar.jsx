import navMenu from "../constants/navMenu";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  const navLinkClass = ({ isActive }) =>
    isActive
      ? "text-white bg-red-500 shadow-lg rounded-xl transition-all duration-200"
      : "text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200";
  return (
    <div className="w-full bg-white/5 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 flex justify-evenly items-center gap-6 text-center">
        {navMenu.map((menu) => {
          const Icon = menu.icon;
          return (
            <div className="group" key={menu.route}>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-1 group-hover:bg-white/20 transition-colors duration-300">
                <NavLink to={menu.route} className={navLinkClass}>
                  <Icon className="w-6 h-6" />
                </NavLink>
              </div>
              <p className="text-xs text-gray-400 font-medium">{menu.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Navbar;
