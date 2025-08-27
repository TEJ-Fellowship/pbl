import { useState } from 'react';

function Navbar({ setActiveSection, setIsModalOpen }) {
    const [isShowTasksBtn, setIsShowTasksBtn] = useState(true);

    return (
        <nav className="">
            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => {
                    setActiveSection("dashboard")
                    setIsShowTasksBtn(true)
                }}
            >

                Dashboard
            </a>


            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => {setActiveSection("programs")
                    setIsShowTasksBtn(true)
                }}
            >
                Programs
            </a>

            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => {
                    setActiveSection("tasks")
                    setIsShowTasksBtn(false)
                }}
            >
                Tasks Manager
            </a>

            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => {setActiveSection("members")
                    setIsShowTasksBtn(true)
                }}
            >
                Members
            </a>

            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => {setActiveSection("overview")
                    setIsShowTasksBtn(true)
                }}
            >
                Overview
            </a>
            {
                isShowTasksBtn && (
                    <button className="w-56 m-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        onClick={() => setIsModalOpen(true)}>
                        Add tasks
                    </button>
                )
            }
        </nav>
    );
}

export default Navbar;



