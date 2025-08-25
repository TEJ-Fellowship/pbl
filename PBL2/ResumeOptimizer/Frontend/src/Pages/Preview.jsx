import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Preview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/resumes`);
        const data = await res.json();
        const selectedResume = data.find((r) => r._id === id);
        setResume(selectedResume);
      } catch (err) {
        console.error("Error fetching resume:", err);
      }
    };
    fetchResume();
  }, [id]);

  if (!resume) return <p>Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <button
        className="text-blue-500 mb-4"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      <h1 className="text-2xl font-bold mb-2">{resume.title}</h1>
      <p className="text-gray-500 mb-6">
        Uploaded: {new Date(resume.uploadDate).toLocaleString()}
      </p>

      <h3 className="text-xl font-semibold mb-2">Extracted Text:</h3>
      <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap">
        {resume.rawText || "No text extracted"}
      </pre>
    </div>
  );
}
