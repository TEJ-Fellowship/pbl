import { useState, useEffect } from "react";
import axios from "axios";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/projects`
        );
        setProjects(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch projects");
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div key={project._id} className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-xl font-bold">{project.title}</h2>
          <p className="text-gray-600">{project.description}</p>
          <div className="mt-2">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              GitHub Repository
            </a>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {project.technologies.map((tech, index) => (
              <span
                key={index}
                className="px-2 py-1 text-sm bg-gray-200 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;
