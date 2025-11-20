const Header = ({ currentUserId }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">f</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Facebook</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-15 h-15 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm">User {currentUserId}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

