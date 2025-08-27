import React, { useState } from "react";

const Profile = ({ user, onLogout}) => {
    if(!user) return <p>Please log in.</p>;

    return (
        <div className="p-4 border rounded">
            <h2 className="text-lg font-bold">Profile</h2>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <button
                onClick={() => {
                    localStorage.removeItem("token");
                    onLogout();
                }}
                className="bg-red-6000 text-white px-4 py-2 rounded mt-3"
            >
                Logout
            </button>
        </div>
    );
};

export default Profile;