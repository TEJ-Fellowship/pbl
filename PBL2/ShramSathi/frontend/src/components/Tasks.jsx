import React, { useState, useEffect } from 'react';
import Taskform from './Taskform.jsx';
import { LuPlus } from 'react-icons/lu';
import { IoFunnelOutline } from "react-icons/io5";
import { IoIosArrowDown } from "react-icons/io";
import { BsPeople } from "react-icons/bs";
import { FiTag } from "react-icons/fi";
import { FiCalendar } from "react-icons/fi";
import axios from 'axios';

function Summary({ value, name, style }) {
    return (
        <div className="h-24 w-[500px] bg-slate-200 pl-7 pt-5 items-center rounded-lg">
            <div>
                <h3 className="font-bold text-2xl" style={style}>{value}</h3>
                <p style={style}>{name}</p>
            </div>
        </div>
    );
}

function TaskManager({ task, programs, onToggleComplete }) {
    const { _id, taskName, description, date, category, assignee, completed, programId } = task;
    const program = programs.find(p => String(p._id) === String(programId));
    const today = new Date();
    const taskDate = new Date(date);
    const isOverdue = !completed && taskDate < today;
    
    let dateOnly = new Date(date).toISOString().split('T')[0];

    return (
        <div className={`w-[1022px] h-28 mt-5 pt-3 pl-5 border border-slate-300 rounded-lg flex
            ${completed ? "bg-green-100" : isOverdue ? "bg-red-100" : "bg-slate-150"}`}>
            <div className='mt-1 mr-5'>
                <input
                    type="checkbox"
                    checked={completed}
                    onChange={() => onToggleComplete(_id, !completed)}
                    className="h-5 w-5 rounded-full border-2 checked:bg-green-500 checked:border-green-500 border-slate-500"
                />
            </div>
            <div>
                <h1 className={`text-xl ${completed ? "line-through text-gray-500" : ""}`}>{taskName}</h1>
                <p className="text-base text-slate-500">{description}</p>
                <div className="flex flex-between mt-1 gap-5">
                    <h1 className="w-auto h-6 px-3 flex justify-center items-center rounded-xl bg-gray-400/20 text-gray-500 gap-3"><FiCalendar />{dateOnly}</h1>
                    <h1 className="w-auto h-6 px-3 flex justify-center items-center rounded-xl bg-blue-600/20 text-green-900 gap-3"><FiTag />{category}</h1>
                    <h1 className="w-auto h-6 px-3 flex justify-center items-center rounded-xl bg-blue-600/20 text-blue-900 gap-3"><BsPeople />{assignee}</h1>
                    {program && (
                        <h1 className="w-auto h-6 px-3 flex items-center rounded-xl bg-purple-600/20 text-purple-900 gap-2">{program.title}</h1>
                    )}
                    {completed && (
                        <h1 className="w-auto h-6 px-3 flex items-center rounded-xl bg-green-600/20 text-green-900 gap-2">
                            Completed
                        </h1>
                    )}

                    {isOverdue && !completed && (
                        <h1 className="w-auto h-6 px-3 flex items-center rounded-xl bg-red-600/20 text-red-900 gap-2">
                            Overdue
                        </h1>
                    )}
                    
                </div>
            </div>
        </div>
    );
}

function normalizeDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0);
    return d;
}

function Tasks() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [sortByDueDate, setSortByDueDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProgram, setSelectedProgram] = useState("");
    const [totalTasks, setTotalTasks] = useState(0);
    const [completed, setCompleted] = useState(0);
    const [pending, setPending] = useState(0);
    const [overdue, setOverdue] = useState(0);
    const [progress, setProgress] = useState(0);

    const [programStats, setProgramStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
    });

    useEffect(() => {
        if (!selectedProgram) {
            setProgramStats({ total: 0, completed: 0, pending: 0, overdue: 0 });
            return;
        }

        const today = normalizeDate(new Date());
        const programTasks = tasks.filter(task => {
            if (typeof task.programId === "object" && task.programId._id) {
                return String(task.programId._id) === String(selectedProgram);
            }
            return String(task.programId) === String(selectedProgram);
        });

        const completedTasks = programTasks.filter(t => t.completed);
        const pendingTasks = programTasks.filter(t => !t.completed && normalizeDate(t.date) >= today);
        const overdueTasks = programTasks.filter(t => !t.completed && normalizeDate(t.date) < today);

        setProgramStats({
            total: programTasks.length,
            completed: completedTasks.length,
            pending: pendingTasks.length,
            overdue: overdueTasks.length,
        });
    }, [tasks, selectedProgram]);

    // Fetch programs
    useEffect(() => {
        axios.get("http://localhost:3000/api/programs")
            .then(res => setPrograms(res.data))
            .catch(err => console.error("Error fetching programs:", err));
    }, []);

    // Fetch tasks
    useEffect(() => {
        axios.get('http://localhost:3000/api/tasks')
            .then(res => setTasks(res.data))
            .catch(err => console.log("Error fetching tasks:", err));
    }, [isModalOpen]);

    // Toggle task complete
    const toggleComplete = async (id, completed) => {
        try {
            const res = await axios.patch(`http://localhost:3000/api/tasks/${id}`, { completed });
            setTasks(tasks.map(t => t._id === id ? res.data : t));
        } catch (err) {
            console.error("Error updating task:", err);
        }
    };

    // Summary stats
    useEffect(() => {
        const today = normalizeDate(new Date());
        setTotalTasks(tasks.length);

        const completedTasks = tasks.filter(t => t.completed);
        setCompleted(completedTasks.length);

        const pendingTasks = tasks.filter(t => !t.completed && normalizeDate(t.date) >= today);
        setPending(pendingTasks.length);

        const overdueTasks = tasks.filter(t => !t.completed && normalizeDate(t.date) < today);
        setOverdue(overdueTasks.length);

        setProgress(tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0);
    }, [tasks]);

    // Filter tasks
    function filterTasks() {
        let filtered = tasks;

        if (searchTerm) {
            filtered = filtered.filter(task => task.category === searchTerm);
        }

        if (selectedProgram) {
            filtered = filtered.filter(task => {
                if (typeof task.programId === "object" && task.programId._id) {
                    return String(task.programId._id) === String(selectedProgram);
                }
                return String(task.programId) === String(selectedProgram);
            });
        }
        return filtered;
    }

    // Sort tasks
    function getDisplayedTasks() {
        let filtered = filterTasks();

        if (sortByDueDate === "Ascending") {
            return [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (sortByDueDate === "Descending") {
            return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        return filtered;
    }

    return (
        <>
            <h1 className="text-xl font-bold text-gray-800 mb-5">Tasks Tracker</h1>

            <div className="flex flex-between flex-wrap gap-5">
                <Summary value={totalTasks} name='Total Tasks' style={{ color: "blue" }} />
                <Summary value={completed} name='Completed' style={{ color: "green" }} />
                <Summary value={pending} name='Pending' style={{ color: "orange" }} />
                <Summary value={overdue} name='Overdue' style={{ color: "red" }} />
                <Summary value={`${progress}%`} name='Progress' style={{ color: "purple" }} />
            </div>

            {selectedProgram && (
                <div className="mt-5">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">
                        Stats for {programs.find(p => p._id === selectedProgram)?.title}
                    </h2>
                    <div className="flex flex-between flex-wrap gap-5">
                        <Summary value={programStats.total} name='Total Tasks' style={{ color: "blue" }} />
                        <Summary value={programStats.completed} name='Completed' style={{ color: "green" }} />
                        <Summary value={programStats.pending} name='Pending' style={{ color: "orange" }} />
                        <Summary value={programStats.overdue} name='Overdue' style={{ color: "red" }} />
                    </div>
                </div>
            )}

            <button className="mt-5 bg-blue-500 flex flex-between gap-2 text-white px-8 py-3 font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:bg-blue-600"
                onClick={() => setIsModalOpen(true)}>
                <LuPlus style={{ marginTop: "3px", color: "white" }} /> <p>Add Task</p>
            </button>
            {isModalOpen && <Taskform setIsModalOpen={setIsModalOpen} />}

            <div className="flex items-center mt-5 gap-4">
                <IoFunnelOutline className="mt-1 text-xl text-slate-500" />

                {/* Category filter */}
                <div className="relative w-40">
                    <select
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full h-10 pl-3 pr-8 text-base border border-slate-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">All Categories</option>
                        <option value="Social Work">Social Work</option>
                        <option value="Education">Education</option>
                        <option value="Health">Health</option>
                    </select>
                    <IoIosArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-900 pointer-events-none" />
                </div>

                {/* Program filter */}
                <div className="relative w-80">
                    <select
                        value={selectedProgram}
                        onChange={e => setSelectedProgram(e.target.value)}
                        className="w-full h-10 pl-3 pr-8 text-base border border-slate-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">All Programs</option>
                        {programs.map(program => (
                            <option key={program._id} value={program._id}>{program.title}</option>
                        ))}
                    </select>
                    <IoIosArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-900 pointer-events-none" />
                </div>

                {/* Sort by due date */}
                <span className="mt-1 text-lg text-slate-500">Sort By:</span>
                <div className="relative w-40">
                    <select
                        value={sortByDueDate}
                        onChange={e => setSortByDueDate(e.target.value)}
                        className="w-full h-10 pl-3 pr-8 text-base border border-slate-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">Due Date</option>
                        <option value="Ascending">Ascending</option>
                        <option value="Descending">Descending</option>
                    </select>
                    <IoIosArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-900 pointer-events-none" />
                </div>
            </div>

            {/* Display tasks */}
            {getDisplayedTasks().map(task => (
                <TaskManager key={task._id} task={task} programs={programs} onToggleComplete={toggleComplete} />
            ))}

            <div className="mt-10">
                <footer className="mt-auto w-full text-center pt-2 text-gray-500 text-sm">
                    {'© Community Flow'}<h1></h1>{'Empowering communities through smart task management'}
                </footer>
            </div>
        </>
    );
}

export default Tasks;
