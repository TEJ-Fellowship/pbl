import { useState, useEffect } from "react";
import axios from "axios";
import { CgProfile } from "react-icons/cg";
import { LuPlus } from "react-icons/lu";
import { MdFormatListBulleted } from "react-icons/md";
import { IoChevronForwardOutline } from "react-icons/io5";
import outReach from "../assets/outreachpic.jpg";
import sustainability from "../assets/sustainability.jpg";
import youth from "../assets/youth.jpg";


function Programs({ style, title, description }) {
  return (
    <div className="flex flex-col w-80 shadow-gray-900">
      <div
        className="h-60 w-80 rounded-xl bg-cover bg-no-repeat flex items-center justify-center shadow-md shadow-slate-500"
        style={style}
      ></div>
      <h1 className="font-bold text-gray-800 mt-2">{title}</h1>
      <div className="text-sm text-gray-500">{description}</div>
    </div>
  );
}

function Summary({ stats, value }) {
  return (
    <div className="w-80 h-28 pl-7 p-6 border border-gray-200 rounded-md shadow-md shadow-gray-400">
      <h1 className="text-base text-gray-800">{stats}</h1>
      <h1 className="text-2xl font-bold text-gray-800">{value}</h1>
    </div>
  );
}

function Setting({ options, details, icon, onClick }) {
  return (
    <div className="flex gap-5 items-center relative cursor-pointer" onClick={onClick}>
      <div>
        <div className="w-14 h-14 mt-6 bg-slate-300 flex items-center justify-center rounded">
          {icon}
        </div>
      </div>
      <div className="w-[930px] h-14 mt-5 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-md text-gray-800">{options}</h1>
          <h1 className="text-sm text-gray-500">{details}</h1>
        </div>
        <div>
          <IoChevronForwardOutline className="w-6 h-6 flex items-center" />
        </div>
      </div>
    </div>
  );
}

function InviteModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const inviteLink = "https://communityflow.com/landing";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">Invite Members</h2>
        <p className="text-sm text-gray-600 mb-4">
          Share this link to invite members to your community:
        </p>
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
          <span className="text-sm text-gray-700 truncate">{inviteLink}</span>
          <button
            onClick={() => navigator.clipboard.writeText(inviteLink)}
            className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Copy
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- State for overview ---
  const [completedTasks, setCompletedTasks] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [totalPrograms, setTotalPrograms] = useState(0);

  // Fetch data from API
  useEffect(() => {
    // Completed tasks
    axios.get("http://localhost:3000/api/tasks?completed=true")
      .then(res => setCompletedTasks(res.data.length))
      .catch(err => console.error("Error fetching completed tasks:", err));

      axios.get("http://localhost:3000/api/tasks")
        .then(res => {
          const tasks = res.data;
          // Get unique assignees
          const uniqueAssignees = [...new Set(tasks.map(task => task.assignee))];
          setActiveMembers(uniqueAssignees.length);
        })
        .catch(err => console.error("Error fetching tasks:", err));

    // Total programs
    axios.get("http://localhost:3000/api/programs")
      .then(res => setTotalPrograms(res.data.length))
      .catch(err => console.error("Error fetching programs:", err));
  }, []);

  return (
    <div>
      <div className="text-3xl font-extrabold text-gray-800">Dashboard</div>

      {/* Programs Section */}
      <h3 className="text-xl font-bold text-gray-800 mt-10">Available Programs</h3>
      <div className="flex space-x-5 mt-3">
        <Programs
          style={{ backgroundImage: `url(${outReach})` }}
          title="Community Outreach Initiative"
          description="Join us in making a difference in our community."
        />
        <Programs
          style={{ backgroundImage: `url(${sustainability})` }}
          title="Environmental Sustainability Drive"
          description="Help us protect our planet for future generations"
        />
        <Programs
          style={{ backgroundImage: `url(${youth})` }}
          title="Youth Empowerment Program"
          description="Mentor young individuals and shape their future."
        />
      </div>

      {/* Overview Section */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 mt-8 mb-5">Overview</h1>
        <div className="flex gap-4">
          <Summary stats="Task Completed" value={completedTasks} />
          <Summary stats="Active Members" value={activeMembers} />
          <Summary stats="Program Supported" value={totalPrograms} />
        </div>
      </div>

      {/* Settings Section */}
      <div className="z-0">
        <h1 className="text-xl font-bold text-gray-800 mt-8 mb-2">Settings</h1>
        <Setting
          options="Account Settings"
          details="Manage your account settings and preferences"
          icon={<CgProfile className="h-6 w-6" />}
        />
        <Setting
          options="Invite Members"
          details="Invite new members to join your community"
          icon={<LuPlus className="h-6 w-6" />}
          onClick={() => setIsModalOpen(true)}
        />
        <Setting
          options="Manage Programs"
          details="View and manage your community programs"
          icon={<MdFormatListBulleted className="h-6 w-6" />}
        />
      </div>

      {/* Invite Members Modal */}
      <InviteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="mt-10">
        <footer className="mt-auto w-full text-center pt-2 text-gray-500 text-sm">
          {'© Community Flow'}<h1></h1>{'Empowering communities through smart task management'}
        </footer>
      </div>
    </div>
  );
}

export default Dashboard;
