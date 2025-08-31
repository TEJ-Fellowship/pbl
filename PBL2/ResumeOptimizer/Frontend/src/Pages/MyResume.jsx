import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/axios";

export default function Resume() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [query, setQuery] = useState("");

  // Fetch user resumes
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await API.get("/resumes/my"); // user-specific
        // Map backend data to ensure title exists
        const mappedResumes = res.data.map((r) => ({
          _id: r._id,
          title: r.title || "Untitled Resume",
          notes: r.notes || "",
          uploadDate: r.uploadDate || r.createdAt,
          filePath: r.filePath,
        }));
        setResumes(mappedResumes);
      } catch (err) {
        console.error("Error fetching resumes:", err);
      }
    };
    fetchResumes();
  }, []);

  // Delete resume
  const handleDelete = async (id) => {
    try {
      await API.delete(`/resumes/${id}`);
      setResumes((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Error deleting resume:", err);
      alert("Could not delete resume. Please try again.");
    }
  };

  const filtered = resumes.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="w-full bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="text-xl font-bold text-gray-800">
            {/* ResumeOptimizer */}
            <div>
  <img src="/Logo.png" alt="ResumeOptimizer Logo" className="h-14 w-auto" />
</div>


          </div>
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-semibold">U</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("jwtToken");
                navigate("/login");
              }}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Resumes</h1>
          <button
            onClick={() => navigate("/home")}
            className="bg-green-100 text-green-700 px-4 py-2 rounded-md hover:bg-green-200"
          >
            Upload Resume
          </button>
        </div>

        <div className="bg-green-50 p-4 rounded mb-4">
          <input
            type="text"
            placeholder="Search resumes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div className="bg-white shadow rounded-md overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Title</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Uploaded</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {(query ? filtered : resumes).map((resume) => (
                <tr key={resume._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{resume.title}</td>
                  <td className="px-6 py-4 text-blue-600">
                    {new Date(resume.uploadDate).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-4">
                    <button
                      onClick={() => navigate(`/preview/${resume._id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      AI Summarize
                    </button>
                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => navigate(`/match/${resume._id}`)}
                      className="text-green-600 hover:underline"
                    >
                      Match
                    </button>
                  </td>
                </tr>
              ))}
              {query && filtered.length === 0 && (
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
