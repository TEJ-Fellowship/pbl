const Navbar = () => {
    return (
      <nav className="flex justify-between items-center p-6">
        <div className="text-xl font-bold">Support Hub</div>
        <div className="space-x-6">
          <a href="#features" className="hover:text-blue-500">Features</a>
          <a href="#pricing" className="hover:text-blue-500">Pricing</a>
          <a href="#help" className="hover:text-blue-500">Help</a>
          <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500">Sign Up</button>
        </div>
      </nav>
    );
  };
  
  export default Navbar;
  