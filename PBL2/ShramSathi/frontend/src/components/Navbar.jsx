import React from 'react';

function Navbar({ setActiveSection }) {
    return (
        <nav className="flex-1 p-4 space-y-2">
            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600"

                onClick={() => setActiveSection("dashboard")}
            >

                Dashboard
            </a>


            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600"
                onClick={() => setActiveSection("programs")}

            >
                Programs
            </a>

            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600"
                onClick={() => setActiveSection("tasks")}
            >
                Tasks
            </a>

            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600"

                onClick={() => setActiveSection("members")}
            >
                Members
            </a>

            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600"
                onClick={() => setActiveSection("overview")}
            >
                Overview
            </a>

            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Add tasks
            </button>
        </nav>
    );
}

export default Navbar;