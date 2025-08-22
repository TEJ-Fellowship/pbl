import React from "react";
import Navbar from "./Navbar.jsx";
import Dashboard from './Dashboard.jsx';
import logourl from '../assets/projectLogo.png'

function DashboardLayout({ activeSection, setActiveSection }) {
    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="fixed top-0 left-0 w-64 h-screen bg-white shadow-md flex flex-col">
                <div className="flex items-center justify-center font-bold border-b"><img src={logourl} className="h-[90px] w-auto" /></div>

                <Navbar setActiveSection = {setActiveSection}/>
                <div className="mt-auto p-4 border-t">
                    <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Logout
                    </button>
                </div>
            </aside>
            <div className="flex-1 ml-64 p-6 bg-gray-100 overflow-y-auto">
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