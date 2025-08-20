import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Resume() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/resumes");
        const data = await res.json();
        setResumes(data);
      } catch (err) {
        console.error("Error fetching resumes:", err);
      }
    };
    fetchResumes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="w-full bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="text-xl font-bold text-gray-800">ResumeOptimizer</div>
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-semibold">U</span>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Resumes</h1>
          <button
            onClick={() => navigate("/home")}
            className="bg-green-100 text-green-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-green-200"
          >
            Upload Resume
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-green-50 flex items-center px-4 py-2 rounded-md mb-6">
          <span className="text-gray-500 mr-2">🔍</span>
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent outline-none w-full"
          />
        </div>

        {/* Resume Table */}
        <div className="bg-white shadow rounded-md overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                  Title
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {resumes.map((resume) => (
                <tr key={resume._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{resume.title}</td>
                  <td className="px-6 py-4 text-blue-600">
                    {new Date(resume.uploadDate).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 space-x-3 text-blue-600">
                    <button onClick={() => navigate("/preview")}>Preview</button>
                    <button className="text-red-500">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

