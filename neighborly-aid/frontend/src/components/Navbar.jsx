import navMenu from "../constants/navMenu";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  const navLinkClass = ({ isActive }) =>
    `relative px-3 py-2 text-lg font-large transition-all duration-300 ${
      isActive ? "text-green-600" : "text-gray-500 hover:text-green-500"
    }`;

  return (
    <nav className="flex gap-8 mb-6">
      {navMenu.map((menu) => {
        return (
          <NavLink key={menu.route} to={menu.route} className={navLinkClass}>
            {({ isActive }) => (
              <>
                {menu.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-pulse"></div>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default Navbar;
