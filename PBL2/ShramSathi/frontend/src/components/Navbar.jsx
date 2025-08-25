import { useState } from 'react';
import axios from 'axios';

function Navbar({ setActiveSection }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [task, setTask] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [category, setCategory] = useState("");
    const [assignee, setAssignee] = useState("");

    const handleAddTask = async (e) => {
        e.preventDefault();
        console.log("New Task:", task);
        const taskObj = {
            taskName: task,
            description,
            date,
            category,
            assignee
        }

        try {
            const response = await axios.post('http://localhost:3000/api/tasks', taskObj);
            console.log('Response: ', response.data);
            alert('Task is added successfully!')
        } catch(err) {
            console.log("Error: ", err);
        }

        setIsModalOpen(false);
        setTask(""); // reset input
    };

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

            {isModalOpen && (
                <div className="fixed top-0 left-0 m-0 p-0 w-screen h-screen flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                        <h2 className="text-xl font-bold mb-4">Add New Task</h2>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <input
                                type="text"
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                                placeholder="Enter task..."
                                className="w-full border p-2 rounded-lg"
                                required
                            />
                            {/* Description */}
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Description"
                                className="w-full border p-2 rounded-lg h-20"
                            ></textarea>

                            {/* Due Date */}
                            <input
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                type="date"
                                className="w-full border p-2 rounded-lg"
                                required
                            />

                            {/* Category Dropdown */}
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2 rounded-lg">
                                <option value="">Select Category</option>
                                <option value="Social Work">Social Work</option>
                                <option value="Education">Education</option>
                                <option value="Health">Health</option>
                            </select>

                            {/* Assignee */}
                            <input
                                value={assignee}
                                onChange={e => setAssignee(e.target.value)}
                                type="text"
                                placeholder="Assignee (optional)"
                                className="w-full border p-2 rounded-lg"
                            />

                            <div className="flex justify-end gap-2">
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Add Task
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;