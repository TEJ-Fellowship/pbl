import { useState, useEffect } from "react";
import {
  TrendingUp,
  Eye,
  Heart,
  Filter,
  Image,
  Search,
  Star,
  Users,
  Code,
  Zap,
  ArrowRight,
  Github,
  ExternalLink,
} from "lucide-react";
import ProjectSubmissionModal from "../components/projects/ProjectSubmissionModal";

const ProjectCard = ({ project }) => {
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(project.stars || Math.floor(Math.random() * 25) + 5);

  const handleStar = () => {
    setIsStarred(!isStarred);
    setStarCount(prev => isStarred ? prev - 1 : prev + 1);
  };

  return (
    <div className="card card-hover animate-fade-in">
      {/* Project Image */}
      <div className="relative bg-gradient-to-br from-surface-100 to-surface-200 aspect-video">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Image className="w-12 h-12 text-surface-400" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute flex flex-wrap gap-2 left-3 top-3">
          <span className="font-semibold text-white badge bg-primary-500">
            Week {project.week}
          </span>
          {project.featured && (
            <span className="font-semibold text-white badge bg-warning-500">
              ✨ Featured
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="absolute flex items-center gap-2 text-white right-3 top-3">
          <button
            onClick={handleStar}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            <span className="text-sm font-medium">{starCount}</span>
          </button>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">{project.views}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold leading-tight text-surface-900">
            {project.title}
            <span
              className={`ml-3 text-xs px-3 py-1 rounded-full font-semibold ${
                project.difficulty === "Advanced"
                  ? "bg-primary-50 text-primary-700"
                  : project.difficulty === "Intermediate"
                  ? "bg-warning-50 text-warning-700"
                  : "bg-success-50 text-success-700"
              }`}
            >
              {project.difficulty}
            </span>
          </h3>
        </div>

        <p
          className="mt-3 overflow-hidden leading-relaxed text-surface-600"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {project.description}
        </p>

        {/* Team */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {project.team.map((member, index) => (
                  <img
                    key={index}
                    src={member.avatar}
                    alt={member.name}
                    className="rounded-full shadow-sm w-9 h-9 ring-3 ring-white"
                    title={member.name}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-surface-600">
                Team of {project.team.length}
              </span>
            </div>
            <span className="text-sm font-medium text-surface-500">
              {project.timeAgo}
            </span>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2 mt-5">
          {project.technologies.map((tech, index) => (
            <span key={index} className="badge badge-secondary">
              {tech}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <a
            href={project.codeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="justify-center flex-1 btn btn-primary"
          >
            View Code
          </a>
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="justify-center flex-1 btn btn-secondary"
          >
            Live Demo
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

  // Scroll to projects section
  const scrollToProjects = () => {
    const projectsSection = document.getElementById('projects-section');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-primary-50/30">
      <div className="mx-auto max-w-7xl">
        {/* Modern Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute rounded-full top-20 left-10 w-72 h-72 bg-primary-100 mix-blend-multiply filter blur-xl opacity-70 animate-pulse-soft"></div>
            <div
              className="absolute rounded-full top-40 right-10 w-72 h-72 bg-secondary-100 mix-blend-multiply filter blur-xl opacity-70 animate-pulse-soft"
              style={{ animationDelay: "2s" }}
            ></div>
            <div className="absolute transform -translate-x-1/2 rounded-full opacity-50 -bottom-8 left-1/2 w-96 h-96 bg-primary-50 mix-blend-multiply filter blur-xl"></div>
          </div>

          {/* Hero Content */}
          <div className="px-4 py-12 sm:px-6 lg:px-8 sm:py-20">
            {/* Stats Banner */}
            <div className="flex flex-col items-center justify-between mb-8 sm:flex-row animate-slide-up">
              <div className="flex items-center gap-3 px-4 py-3 mb-4 border bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border-white/60 sm:mb-0">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-medium">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-medium text-surface-600">
                    Weekly Submissions
                  </div>
                  <div className="text-lg font-bold text-surface-900">
                    {projects.length || "0"} Projects
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="relative px-6 py-3 overflow-hidden text-white transition-all duration-300 transform group bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-medium hover:shadow-lg hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center gap-2 font-medium">
                  Submit Project
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-primary-600 to-primary-700 group-hover:opacity-100"></div>
              </button>
            </div>

            {/* Main Hero Content */}
            <div className="text-center animate-fade-in">
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold border rounded-full bg-primary-50 text-primary-700 border-primary-200">
                  <Code className="w-4 h-4" />
                  TEJ Bootcamp Showcase
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-surface-900">
                <span className="block">Where Bootcamp</span>
                <span className="block text-transparent bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 bg-clip-text">
                  Dreams
                </span>
                <span className="block">Come to Life</span>
              </h1>

              <p className="max-w-3xl mx-auto mb-8 text-lg leading-relaxed sm:text-xl text-surface-600">
                Showcase your bootcamp journey! From your first "Hello World" to full-stack masterpieces,
                <span className="font-semibold text-primary-600">
                  {" "}share your progress{" "}
                </span>
                and
                <span className="font-semibold text-primary-600">
                  {" "}inspire fellow learners{" "}
                </span>
                on this incredible coding adventure.
              </p>

              {/* Hero CTAs */}
              <div className="flex flex-col items-center justify-center gap-4 mb-12 sm:flex-row">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="relative px-6 py-3 overflow-hidden text-white transition-all duration-300 transform group bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-medium hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span className="relative z-10 flex items-center gap-2 font-semibold">
                    <Code className="w-5 h-5" />
                    Share Your Project
                  </span>
                  <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-primary-600 to-primary-700 group-hover:opacity-100"></div>
                </button>

                <button 
                  onClick={scrollToProjects}
                  className="flex items-center gap-2 px-6 py-3 text-lg font-medium transition-all duration-300 border group bg-white/80 backdrop-blur-sm hover:bg-white text-surface-700 hover:text-surface-900 rounded-xl shadow-soft hover:shadow-medium border-surface-200 hover:border-surface-300"
                >
                  <Users className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  Explore Projects
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>

              {/* Feature highlights */}
              <div className="grid max-w-4xl grid-cols-1 gap-6 mx-auto md:grid-cols-3">
                <div className="p-4 transition-all duration-300 border group bg-white/60 backdrop-blur-sm rounded-xl border-white/80 hover:shadow-medium">
                  <div className="flex items-center justify-center w-10 h-10 mb-3 transition-transform duration-300 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg group-hover:scale-110">
                    <Github className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="mb-2 font-bold text-surface-900">
                    Code Reviews
                  </h3>
                  <p className="text-sm text-surface-600">
                    Get feedback from peers and instructors on your projects.
                  </p>
                </div>

                <div className="p-4 transition-all duration-300 border group bg-white/60 backdrop-blur-sm rounded-xl border-white/80 hover:shadow-medium">
                  <div className="flex items-center justify-center w-10 h-10 mb-3 transition-transform duration-300 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg group-hover:scale-110">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="mb-2 font-bold text-surface-900">
                    Star & Support
                  </h3>
                  <p className="text-sm text-surface-600">
                    Star projects you love and support your fellow bootcampers.
                  </p>
                </div>

                <div className="p-4 transition-all duration-300 border group bg-white/60 backdrop-blur-sm rounded-xl border-white/80 hover:shadow-medium">
                  <div className="flex items-center justify-center w-10 h-10 mb-3 transition-transform duration-300 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg group-hover:scale-110">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="mb-2 font-bold text-surface-900">
                    Weekly Spotlights
                  </h3>
                  <p className="text-sm text-surface-600">
                    Outstanding projects get featured and celebrated weekly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Search Section */}
        <div id="projects-section" className="px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-1 p-1 bg-white border rounded-xl shadow-soft border-surface-200">
                <button
                  className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    activeTab === "all"
                      ? "bg-primary-500 text-white shadow-medium"
                      : "text-surface-600 hover:text-surface-900 hover:bg-surface-50"
                  }`}
                  onClick={() => setActiveTab("all")}
                >
                  All Projects
                  <span className="ml-2 px-2 py-0.5 text-xs bg-surface-100 text-surface-600 rounded-full">
                    {projects.length}
                  </span>
                </button>
                <button
                  className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    activeTab === "featured"
                      ? "bg-primary-500 text-white shadow-medium"
                      : "text-surface-600 hover:text-surface-900 hover:bg-surface-50"
                  }`}
                  onClick={() => setActiveTab("featured")}
                >
                  ✨ Featured
                </button>
                <button
                  className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    activeTab === "trending"
                      ? "bg-primary-500 text-white shadow-medium"
                      : "text-surface-600 hover:text-surface-900 hover:bg-surface-50"
                  }`}
                  onClick={() => setActiveTab("trending")}
                >
                  🔥 Trending
                </button>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search projects, technologies, or authors..."
                  className="pl-12 input-field"
                />
                <div className="absolute transform -translate-y-1/2 left-4 top-1/2">
                  <Search className="w-5 h-5 text-surface-400" />
                </div>
              </div>
              <button className="gap-2 btn btn-secondary">
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>
          </div>

          {/* Project Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 rounded-full border-surface-200 animate-spin border-t-primary-500"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-pulse border-t-primary-300"></div>
              </div>
              <span className="mt-6 text-lg font-medium text-surface-600">
                Loading amazing projects...
              </span>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-primary-50">
                  <svg
                    className="w-8 h-8 text-primary-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-bold text-surface-900">
                  Oops! Something went wrong
                </h3>
                <p className="mb-6 text-surface-600">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-20 text-center">
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-surface-100">
                  <svg
                    className="w-10 h-10 text-surface-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-surface-900">
                  No projects yet
                </h3>
                <p className="mb-8 text-surface-600">
                  Be the first to share your amazing work with the community!
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-primary shadow-medium"
                >
                  Submit Your Project
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          )}
        </div>

        <ProjectSubmissionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      </div>
    </div>
  );
};

export default Home;
