import navMenu from "../constants/navMenu";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./common/ThemeToggle";

const Navbar = () => {
  const navLinkClass = ({ isActive }) =>
    `relative px-3 py-2 text-lg font-large transition-all duration-300 ${
      isActive ? "text-primary" : "text-text-light dark:text-text-spotlight hover:text-text-dark"
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
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary-light to-primary rounded-full animate-pulse"></div>
                )}
              </>
            )}
          </NavLink>
        );
      })}
       <ThemeToggle />
    </nav>
  );
};

export default Navbar;
