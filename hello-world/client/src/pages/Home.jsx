import { useState, useEffect } from "react";
import { TrendingUp, Eye, Heart, Filter, Image } from "lucide-react";
import ProjectSubmissionModal from "../components/projects/ProjectSubmissionModal";

const ProjectCard = ({ project }) => {
  return (
    <div className="overflow-hidden transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
      {/* Project Image */}
      <div className="relative bg-gray-100 aspect-video">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Image className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute flex flex-wrap gap-2 left-3 top-3">
          <span className="px-2 py-1 text-xs font-semibold text-white bg-indigo-500 rounded-full">
            Week {project.week}
          </span>
          {project.featured && (
            <span className="px-2 py-1 text-xs font-semibold text-white bg-yellow-500 rounded-full">
              Featured
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="absolute flex items-center gap-3 text-white right-3 top-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50">
            <Heart className="w-4 h-4" /> <span>{project.likes}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50">
            <Eye className="w-4 h-4" /> <span>{project.views}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">
            {project.title}
            <span
              className={`ml-2 text-xs px-2 py-1 rounded-full ${
                project.difficulty === "Advanced"
                  ? "bg-red-50 text-red-700"
                  : project.difficulty === "Intermediate"
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {project.difficulty}
            </span>
          </h3>
        </div>

        <p
          className="mt-2 overflow-hidden text-sm text-gray-600"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {project.description}
        </p>

        {/* Team */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {project.team.map((member, index) => (
                  <img
                    key={index}
                    src={member.avatar}
                    alt={member.name}
                    className="w-8 h-8 rounded-full ring-2 ring-white"
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                Team of {project.team.length}
              </span>
            </div>
            <span className="text-sm text-gray-500">{project.timeAgo}</span>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2 mt-4">
          {project.technologies.map((tech, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-full"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          <a
            href={project.codeUrl}
            target="_blank"
            className="flex-1 px-4 py-2 text-sm font-medium text-center text-white transition-colors bg-indigo-500 rounded-lg hover:bg-indigo-600"
          >
            Code
          </a>
          <a
            href={project.demoUrl}
            target="_blank"
            className="flex-1 px-4 py-2 text-sm font-medium text-center text-gray-900 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Demo
          </a>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/projects`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await response.json();

        // Transform API data to match the UI structure
        const transformedProjects = data.map((project, index) => ({
          id: project._id,
          title: project.title,
          description: project.description,
          difficulty: "Intermediate", // Default value since it's not in the API
          week: Math.floor(Math.random() * 12) + 1, // Random week for now
          featured: index === 0, // First project is featured
          likes: Math.floor(Math.random() * 50) + 10, // Random likes
          views: Math.floor(Math.random() * 200) + 50, // Random views
          team:
            project.collaborators.length > 0
              ? project.collaborators.map((collab) => ({
                  name: collab.name,
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${collab.name}`,
                }))
              : [
                  {
                    name: "Developer",
                    avatar:
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=Default",
                  },
                ],
          technologies: project.technologies,
          timeAgo: new Date(project.createdAt).toLocaleDateString(),
          codeUrl: project.githubUrl,
          demoUrl: project.liveUrl || "#",
          image: project.screenshots?.[0] || null,
        }));

        setProjects(transformedProjects);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Refetch projects when modal closes (in case a new project was added)
  const handleModalClose = () => {
    setIsModalOpen(false);
    // Refetch projects
    const fetchProjects = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/projects");
        if (response.ok) {
          const data = await response.json();
          const transformedProjects = data.map((project, index) => ({
            id: project._id,
            title: project.title,
            description: project.description,
            difficulty: "Intermediate",
            week: Math.floor(Math.random() * 12) + 1,
            featured: index === 0,
            likes: Math.floor(Math.random() * 50) + 10,
            views: Math.floor(Math.random() * 200) + 50,
            team:
              project.collaborators.length > 0
                ? project.collaborators.map((collab) => ({
                    name: collab.name,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${collab.name}`,
                  }))
                : [
                    {
                      name: "Developer",
                      avatar:
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=Default",
                    },
                  ],
            technologies: project.technologies,
            timeAgo: new Date(project.createdAt).toLocaleDateString(),
            codeUrl: project.githubUrl,
            demoUrl: project.liveUrl || "#",
            image: project.screenshots?.[0] || null,
          }));
          setProjects(transformedProjects);
        }
      } catch (err) {
        console.error("Error refetching projects:", err);
      }
    };
    fetchProjects();
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Stats Banner */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 rounded-lg bg-blue-50">
            <TrendingUp className="w-4 h-4" />
            <span>{projects.length} projects submitted</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            Submit Project
          </button>
        </div>

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Weekly Project Showcase
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Discover innovative projects built by bootcamp teams and individual
            fellows
          </p>
        </div>

        {/* Tabs & Search */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4 border-b border-gray-200">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "all"
                    ? "border-b-2 border-indigo-500 text-indigo-500"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab("all")}
              >
                All Projects
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {projects.length}
                </span>
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "featured"
                    ? "border-b-2 border-indigo-500 text-indigo-500"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab("featured")}
              >
                Featured
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "trending"
                    ? "border-b-2 border-indigo-500 text-indigo-500"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab("trending")}
              >
                Trending
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search projects, technologies, or authors..."
                className="w-full rounded-lg border-0 bg-white px-4 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-900 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading projects...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-red-600">Error: {error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-white bg-indigo-500 rounded-lg hover:bg-indigo-600"
            >
              Retry
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-gray-600">
              No projects found. Be the first to submit one!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-white bg-indigo-500 rounded-lg hover:bg-indigo-600"
            >
              Submit Project
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        <ProjectSubmissionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      </div>
    </div>
  );
};

export default Home;
