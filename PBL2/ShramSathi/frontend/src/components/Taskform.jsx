import { useState, useEffect } from 'react';
import axios from "axios";
import { IoIosArrowDown } from "react-icons/io";

function Taskform({ setIsModalOpen }) {
    const [task, setTask] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [category, setCategory] = useState("");
    const [assignee, setAssignee] = useState("");
    const [program, setProgram] = useState("");  // stores selected programId
    const [programsDropDown, setProgramsDropDown] = useState([]);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        axios.get("http://localhost:3000/api/programs")
            .then(response => {
                setProgramsDropDown(
                    response.data.map(program => ({
                        id: program._id,
                        title: program.title
                    }))
                );
            })
            .catch(err => console.log('Error:', err));
    }, []); // ✅ only fetch once, not on every change

    const handleAddTask = async (e) => {
        e.preventDefault();

        // ✅ Include programId
        const taskObj = { 
            taskName: task, 
            description, 
            date, 
            category, 
            assignee, 
            programId: program 
        };

        try {
            const response = await axios.post("http://localhost:3000/api/tasks", taskObj);
            console.log("Response:", response.data);
            alert("Task added successfully!");
        } catch (err) {
            console.log("Error:", err);
        }

        setIsModalOpen(false);
        setTask(""); 
        setDescription("");
        setDate("");
        setCategory("");
        setAssignee("");
        setProgram(""); // reset program after submit
    };





    return (

        
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
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
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description"
                        className="w-full border p-2 rounded-lg h-20"
                    ></textarea>
                    <input
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        type="date"
                        min={today}
                        className="w-full border p-2 rounded-lg"
                        required
                    />

                    {/* Program Dropdown with arrow */}
                    <div className="relative">
                        <select
                            value={program}
                            onChange={(e) => setProgram(e.target.value)}
                            className="w-full border p-2 rounded-lg appearance-none"
                            required
                        >
                            <option value="">Select Program</option>
                            {programsDropDown.map((program) => (
                                <option key={program.id} value={program.id}>
                                    {program.title}
                                </option>
                            ))}
                        </select>
                        <IoIosArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                    </div>

                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border p-2 rounded-lg"
                        required
                    >
                        <option value="">Select Category</option>
                        <option value="Social Work">Social Work</option>
                        <option value="Education">Education</option>
                        <option value="Health">Health</option>
                    </select>
                    <input
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        type="text"
                        placeholder="Assignee (optional)"
                        className="w-full border p-2 rounded-lg"
                    />

                    <div className="flex justify-end gap-2">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Add Task
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
};

export default Taskform;
