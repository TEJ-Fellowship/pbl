import React from "react";
import Navbar from "./Navbar.jsx";
import Dashboard from './Dashboard.jsx';

function DashboardLayout({ activeSection, setActiveSection }) {
    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-4 text-xl font-bold border-b">सहयोगी हात</div>

                <Navbar setActiveSection = {setActiveSection}/>
                <div className="p-4 border-t">
                    <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Logout
                    </button>
                </div>
            </aside>
            <div className="flex-1 p-6 bg-gray-100">
                {activeSection === 'dashboard' && <Dashboard /> }
                {activeSection === 'programs' && <h1>hi program</h1>}
                {activeSection === 'tasks' && <h1>hi tasks</h1>}
                {activeSection === 'members' && <h1>hi members</h1>}
                {activeSection === 'overview' && <h1>hi overview</h1>}
            </div>
            
        </div>
    );
}

export default DashboardLayout; 