import { SiDiscord } from "react-icons/si";

const Navbar = () => {
    return (
      <nav className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60 bg-gray-900/80 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-3 md:px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 -ml-1 md:-ml-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
              <SiDiscord size={16} />
            </span>
            <span className="text-sm md:text-base font-semibold tracking-tight">Support Hub</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#help" className="hover:text-white">Help</a>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden md:inline-flex h-9 items-center rounded-md border border-gray-700 px-3 text-sm text-gray-300 hover:bg-gray-800">Log In</button>
            <button className="inline-flex h-9 items-center rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-500">Sign Up</button>
          </div>
        </div>
      </nav>
    );
  };
  
  export default Navbar;
  