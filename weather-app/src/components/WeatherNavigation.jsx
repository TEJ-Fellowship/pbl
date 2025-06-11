import React, { useState } from "react";

const WeatherNavigationMenu = () => {
  const menuList = ["WEATHER", "AIR QUALITY", "NEWS"];
  const [activeMenu, setActiveMenu] = useState("WEATHER");
  return (
    <>
      <div className="absolute bottom-0 left-0 w-full flex justify-around text-white text-sm">
        {menuList.map((menu) => (
          <span
            key={menu}
            className={`py-2 ${
              menu === activeMenu
                ? "border-b-2 border-yellow-400"
                : "border-b-2 border-transparent"
            } hover:opacity-100 transition-all duration-300 cursor-pointer`}
            onClick={() => setActiveMenu(menu)}
          >
            {menu}
          </span>
        ))}
      </div>
    </>
  );
};

export default WeatherNavigationMenu;
