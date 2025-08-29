import React from "react";

const Profile = ({ user, onLogout }) => {
  if (!user) return <p className="text-center text-gray-600">Please log in.</p>;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6">
      <div className="flex items-center gap-4">
        {/* Avatar with initials */}
        <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-xl font-bold text-black">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {user.username}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Divider */}
      <hr className="my-4 border-gray-200 dark:border-gray-700" />

      <div className="flex justify-end">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            onLogout();
          }}
          className="px-5 py-2 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
