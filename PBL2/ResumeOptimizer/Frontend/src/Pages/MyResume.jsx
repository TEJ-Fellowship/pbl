import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Resume() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]); // all resumes from backend
  const [query, setQuery] = useState(""); // search text
  const [toggle, setToggle] = useState(false); // controls search vs all

  // Fetch all resumes once
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

  // Delete function
  async function handelDelete(id) {
    try {
      const res = await fetch(`http://localhost:5000/api/resumes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete resume");
      }

      // Update frontend state after backend confirms deletion
      setResumes((prev) => prev.filter((resume) => resume._id !== id));
    } catch (err) {
      console.error("Error deleting resume:", err);
      alert("Could not delete resume. Please try again.");
    }
  }

  // Whenever query changes decide whether to toggle search
  useEffect(() => {
    if (query.trim() === "") {
      setToggle(false); // show all
    } else {
      setToggle(true); // show filtered
    }
  }, [query]);

  // Filter logic (title + notes search)
  const filtered = resumes.filter(
    (resume) =>
      resume.title.toLowerCase().includes(query.toLowerCase()) ||
      (resume.notes && resume.notes.toLowerCase().includes(query.toLowerCase()))
  );

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
            onClick={() => navigate("/")}
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
              {(toggle ? filtered : resumes).map((resume) => (
                <tr key={resume._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{resume.title}</td>
                  <td className="px-6 py-4 text-blue-600">
                    {new Date(resume.uploadDate).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-4">
                    <a
                      href={`/preview/${resume._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Ai Summarize
                    </a>

                    <button
                      className="text-red-500 darker hover:underline"
                      onClick={() => handelDelete(resume._id)}
                    >
                      Delete
                    </button>

                    <button
                      className="text-green-600 hover:underline"
                      onClick={() => navigate(`/match/${resume._id}`)}
                    >
                      Match
                    </button>
                  </td>
                </tr>
              ))}

              {/* If searching but nothing found */}
              {toggle && filtered.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-gray-500 text-center">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
