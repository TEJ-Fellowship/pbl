const WeatherNavigationMenu = ({ activeMenu, handleActiveMenu }) => {
  const menuList = ["WEATHER", "AIR QUALITY", "NEWS"];
  return (
    <>
      <div className="absolute bottom-0 left-0 w-full flex justify-around text-white text-sm">
        {menuList.map((menu) => (
          <span
            key={menu}
            className={`py-2 ${
              menu === activeMenu
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent"
            } hover:opacity-100 transition-all duration-300`}
            style={{ cursor: "pointer" }}
            onClick={() => handleActiveMenu(menu)}
          >
            {menu}
          </span>
        ))}
      </div>
    </>
  );
};

export default WeatherNavigationMenu;
