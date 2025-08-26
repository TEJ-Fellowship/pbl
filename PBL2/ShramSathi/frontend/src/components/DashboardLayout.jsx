import React, { useState } from "react";
import Navbar from "./Navbar.jsx";
import Dashboard from "./Dashboard.jsx";
import logourl from "../assets/projectLogo.png";
import LandingPage from "../pages/LandingPage.jsx";
import axios from "axios"

function DashboardLayout({ activeSection, setActiveSection }) {
  const [showLanding, setShowLanding] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [assignee, setAssignee] = useState("");


  const handleAddTask = async (e) => {
    e.preventDefault();
    const taskObj = { taskName: task, description, date, category, assignee };

    try {
      const response = await axios.post("http://localhost:3000/api/tasks", taskObj);
      console.log("Response:", response.data);
      alert("Task added successfully!");
    } catch (err) {
      console.log("Error:", err);
    }

    setIsModalOpen(false);
    setTask(""); // reset
  };


  return (
    <>
      {showLanding ? <LandingPage showLanding={showLanding} setShowLanding={setShowLanding} /> :
        (<div className="flex h-screen bg-gray-100">
          <aside className="fixed top-0 left-0 w-64 h-screen bg-white shadow-md flex flex-col">
            <div className="flex items-center justify-center font-bold border-b">
              <img src={logourl} className="h-[90px] w-auto" />
            </div>
            <Navbar setActiveSection={setActiveSection} setIsModalOpen={setIsModalOpen}/>
            <div className="mt-auto p-4 border-t">
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Logout
              </button>
            </div>
          </aside>
          <div className="flex-1 ml-64 p-6 bg-gray-100 overflow-y-auto">
            {activeSection === "dashboard" && <Dashboard />}
            {activeSection === "programs" && <h1>hi program</h1>}
            {activeSection === "tasks" && <h1>hi tasks</h1>}
            {activeSection === "members" && <h1>hi members</h1>}
            {activeSection === "overview" && <h1>hi overview</h1>}
          </div>
        </div>
      )}

      {isModalOpen && (
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
                className="w-full border p-2 rounded-lg"
                required
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border p-2 rounded-lg"
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
      )}
    </>
  );
}

export default DashboardLayout;
