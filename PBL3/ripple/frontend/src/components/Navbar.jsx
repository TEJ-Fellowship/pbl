import { useState } from 'react';

const Navbar = () => {
  const [activeItem, setActiveItem] = useState('Home');

  const navItems = ['Home', 'Explore', 'Notifications', 'Activity Log'];


  const handleNavClick = (item) => {
    setActiveItem(item);  
  };
  return (
    <nav className="w-full bg-gray-900 border-b border-gray-700 px-8 py-4">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-48">
            <img src="/logo2.png" alt="logo" />
          </div>
        </div>

        <div className="flex items-center space-x-8">
          
          {navItems.map((item) => (
            <button
              key={item}  
              onClick={() => handleNavClick(item)}  
              className={`relative px-4 py-2 font-medium transition-colors group ${
                activeItem === item
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'  
              }`}
            >
              {item}

              
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 transform transition-transform origin-left duration-200 ${
                  activeItem === item ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              ></div>
            </button>
          ))}
        </div>


        <div className="flex items-center gap-4">
          {/* Settings Icon */}
          <button className="p-2 rounded-lg w-10 border-2 border-transparent transition-colors hover:border-green-500">
            <img src="/settings.png" alt="setting" />
          </button>

          {/* Profile Avatar */}
          <button className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-green-400 transition-all">
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
