import navMenu from "../constants/navMenu";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  const navLinkClass = ({ isActive }) => (isActive ? "hover:bg-white/10" : "");
  return (
    <>
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        {navMenu.map((menu) => {
          const Icon = menu.icon;
          return (
            <div className="group" key={menu.route}>
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-2 group-hover:bg-white/10 transition-colors duration-300">
                <NavLink to={menu.route} className={navLinkClass}>
                  <Icon className="w-6 h-6 text-red-500" />
                </NavLink>
              </div>
              <p className="text-xs text-gray-400">{menu.label}</p>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Navbar;
