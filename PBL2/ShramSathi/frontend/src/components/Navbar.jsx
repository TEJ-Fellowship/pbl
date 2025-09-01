import { useState } from 'react';
import { LayoutDashboard, CalendarCheck, ListTodo, Bot, BarChart3 } from "lucide-react";
import Taskform from './Taskform';

function Navbar({ setActiveSection, activeSection }) {  // 👈 make sure parent passes activeSection
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTaskBottom, setIsTaskBottom] = useState(true);

    return (
        <nav className="">
            <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => {setActiveSection("dashboard")
                    setIsTaskBottom(true);
                }}
            >
                <LayoutDashboard className="w-6 h-6" />
                <span>Dashboard</span>
            </a>

            <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => { setActiveSection("programs")
                    setIsTaskBottom(true);
                }}
            >
                <CalendarCheck className="w-6 h-6" /> 
                <span>Programs</span>
            </a>

            <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => {setActiveSection("tasks")
                    setIsTaskBottom(false);
                }}
            >
                <ListTodo className="w-6 h-6" />
                <span>Tasks</span>
            </a>

            <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => setActiveSection("gemini")}
            >
                <Bot className="w-6 h-6" />
                <span>AI Suggestion</span>
            </a>

            {/* 👇 Button will not show if "tasks" section is active */}
            {isTaskBottom && (
                <button 
                    className="w-56 m-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={() => setIsModalOpen(true)}
                >
                    Add tasks
                </button>
            )}
            {isModalOpen && <Taskform setIsModalOpen={setIsModalOpen} />}
        </nav>
    );
}

export default Navbar;
