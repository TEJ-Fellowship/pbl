
function Navbar({ setActiveSection , setIsModalOpen}) {

    return (
        <nav className="">
            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                
                onClick={() => setActiveSection("dashboard")}
            >

                Dashboard
            </a>


            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => setActiveSection("programs")}

            >
                Programs
            </a>

            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => setActiveSection("tasks")}
            >
                Tasks
            </a>

            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"

                onClick={() => setActiveSection("members")}
            >
                Members
            </a>

            <a
                href="#"
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 m-4"
                onClick={() => setActiveSection("overview")}
            >
                Overview
            </a>

            <button className="w-56 m-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={() => setIsModalOpen(true)}>
                Add tasks
            </button>
        </nav>
    );
}

export default Navbar;



