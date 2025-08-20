import React from "react";

function Dashboard({ activeSection, setActiveSection }) {
    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-4 text-xl font-bold border-b">सहयोगी हात</div>

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

                <div className="p-4 border-t">
                    <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Logout
                    </button>
                </div>
            </aside>
            <div className="flex-1 p-6 bg-gray-100">
                {activeSection === 'dashboard' && <h1>hi dashboard</h1>}
                {activeSection === 'programs' && <h1>hi program</h1>}
                {activeSection === 'tasks' && <h1>hi tasks</h1>}
                {activeSection === 'members' && <h1>hi members</h1>}
                {activeSection === 'overview' && <h1>hi overview</h1>}
            </div>



        </div>
    );
}

export default Dashboard; 