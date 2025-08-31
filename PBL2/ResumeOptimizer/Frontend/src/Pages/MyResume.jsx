import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/axios";

export default function Resume() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [query, setQuery] = useState("");
  const [toggle, setToggle] = useState(false);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await API.get("/resumes");
        setResumes(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchResumes();
  }, []);

  const handleDelete = async (id) => {
    try {
      await API.delete(`/resumes/${id}`);
      setResumes((prev) => prev.filter((resume) => resume._id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not delete resume.");
    }
  };

  useEffect(() => {
    setToggle(query.trim() !== "");
  }, [query]);

  const filtered = resumes.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="w-full bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="text-xl font-bold text-gray-800">ResumeOptimizer</div>
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

      {/* Content */}
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

        <div className="grid md:grid-cols-3 gap-4">
          {(toggle ? filtered : resumes).map((r) => (
            <div key={r._id} className="bg-white p-4 rounded shadow">
              <h2 className="font-semibold text-gray-800">{r.title}</h2>
              <p className="text-gray-600 text-sm">{r.notes}</p>
              <p className="text-gray-500 text-xs mt-1">
                Uploaded: {new Date(r.createdAt).toLocaleString()}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => navigate(`/preview/${r._id}`)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Preview
                </button>
                <button
                  onClick={() => handleDelete(r._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
