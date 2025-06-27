import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { projectsApi } from "../services/api";
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
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Grid,
  Layout,
  Sliders,
  Clock,
  Flame,
  Award,
  AlertCircle,
  ThumbsUp,
} from "lucide-react";
import ProjectSubmissionModal from "../components/projects/ProjectSubmissionModal";

// Navigation Header Component
const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-primary-600">
              <Code className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              TEJ Bootcamp
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-6 md:flex">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                {(user?.role === "admin" || user?.role === "instructor") && (
                  <Link
                    to="/admin/users"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Manage Users
                  </Link>
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 group"
                  >
                    {user?.githubProfile?.avatar_url ? (
                      <img
                        src={user.githubProfile.avatar_url}
                        alt={user.name}
                        className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-primary-50"
                      />
                    ) : (
                      <div className="flex justify-center items-center w-8 h-8 bg-gray-100 rounded-full ring-2 ring-transparent group-hover:ring-primary-50">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user?.name || user?.preferredName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900">
                          {user?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user?.email}
                        </div>
                        <div className="text-xs text-primary-600 capitalize">
                          {user?.role}
                        </div>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="mr-2 w-4 h-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="mr-2 w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="py-4 border-t border-gray-100 md:hidden">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    {user?.githubProfile?.avatar_url ? (
                      <img
                        src={user.githubProfile.avatar_url}
                        alt={user.name}
                        className="w-10 h-10 rounded-full ring-2 ring-primary-50"
                      />
                    ) : (
                      <div className="flex justify-center items-center w-10 h-10 bg-gray-100 rounded-full ring-2 ring-primary-50">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {user?.name}
                      </div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                      <div className="text-xs text-primary-600 capitalize">
                        {user?.role}
                      </div>
                    </div>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="mr-2 w-4 h-4" />
                  Dashboard
                </Link>
                {(user?.role === "admin" || user?.role === "instructor") && (
                  <Link
                    to="/admin/users"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    <Users className="mr-2 w-4 h-4" />
                    Manage Users
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="mr-2 w-4 h-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="px-4 space-y-3">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full px-4 py-2 text-sm font-medium text-center text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

const ProjectCard = ({ project }) => {
  const { isAuthenticated } = useAuth();
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(
    project.stars || Math.floor(Math.random() * 25) + 5
  );

  const handleStar = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please sign in to appreciate projects");
      return;
    }
    setIsStarred((prev) => !prev);
    setStarCount((prev) => (isStarred ? prev - 1 : prev + 1));
  };

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300">
      {/* Project Cover */}
      <a
        href={project.demoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {project.image ? (
            <img
              src={project.image}
              alt={project.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex justify-center items-center h-full">
              <Layout className="w-16 h-16 text-gray-300" />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-center h-full text-white text-center">
              <div>
                <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                <div className="flex items-center justify-center gap-4">
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60">
                    <Eye className="w-4 h-4" />
                    {project.views}
                  </button>
                  <button
                    onClick={handleStar}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {starCount}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>

      {/* Project Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {project.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 truncate">
              {project.description}
            </p>
          </div>
          <button
            onClick={handleStar}
            className={`ml-4 p-2 rounded-lg ${
              isStarred
                ? "text-primary-600 bg-primary-50"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ThumbsUp className="w-5 h-5" />
          </button>
        </div>

        {/* Project Meta */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {project.team.slice(0, 3).map((member, idx) => (
                <button
                  key={idx}
                  className="relative group/tooltip"
                  title={member.name}
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-7 h-7 rounded-full border-2 border-white"
                  />
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover/tooltip:opacity-100 whitespace-nowrap">
                    {member.name}
                  </span>
                </button>
              ))}
            </div>
            {project.team.length > 3 && (
              <button className="text-sm text-gray-500 hover:text-gray-700">
                +{project.team.length - 3} more
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <button className="flex items-center text-gray-500 hover:text-gray-700">
              <Clock className="w-4 h-4 mr-1" />
              {project.timeAgo}
            </button>
            {project.featured && (
              <button className="flex items-center text-warning-600 hover:text-warning-700">
                <Flame className="w-4 h-4 mr-1" />
                Featured
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg ${
      active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    {children}
  </button>
);

const IconButton = ({ icon: Icon, onClick, label }) => (
  <button
    onClick={onClick}
    className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
    aria-label={label}
  >
    <Icon className="w-5 h-5" />
  </button>
);

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await projectsApi.getAll();
        const data = response.data;

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
        const response = await projectsApi.getAll();
        const data = response.data;
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
      } catch (err) {
        console.error("Error refetching projects:", err);
      }
    };
    fetchProjects();
  };

  // Handle project submission
  const handleSubmitProject = () => {
    if (!isAuthenticated) {
      alert("Please sign in to submit a project");
      return;
    }
    setIsModalOpen(true);
  };

  const filteredProjects = projects.filter((project) => {
    if (activeTab === "featured" && !project.featured) return false;
    if (activeTab === "recent") {
      // Filter projects from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(project.createdAt) > sevenDaysAgo;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.technologies.some((tech) => tech.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                Discover Creative
                <span className="block mt-2 text-primary-600">
                  Student Projects
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-2xl">
                Showcase your work, get inspired by fellow students, and grow
                your creative career.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={handleSubmitProject}
                  className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Zap className="mr-2 w-5 h-5" />
                  Share Your Work
                </button>
                <a
                  href="#projects"
                  className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <Eye className="mr-2 w-5 h-5" />
                  Browse Projects
                </a>
              </div>
            </div>
            <div className="flex-1 hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {projects.slice(0, 4).map((project, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden"
                  >
                    {project.image && (
                      <img
                        src={project.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 py-4">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <FilterButton
                  active={activeTab === "all"}
                  onClick={() => setActiveTab("all")}
                >
                  All
                </FilterButton>
                <FilterButton
                  active={activeTab === "featured"}
                  onClick={() => setActiveTab("featured")}
                >
                  Featured
                </FilterButton>
                <FilterButton
                  active={activeTab === "recent"}
                  onClick={() => setActiveTab("recent")}
                >
                  Recent
                </FilterButton>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconButton icon={Grid} onClick={() => {}} label="Grid view" />
              <IconButton
                icon={Sliders}
                onClick={() => {}}
                label="Filter options"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <section id="projects" className="py-8">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="p-4 bg-red-50 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="mt-4 text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Try Again
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="p-4 bg-gray-100 rounded-full">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="mt-4 text-gray-600">No projects found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Clear Search
                  <X className="ml-2 w-4 h-4 inline-block" />
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Project Submission Modal */}
      {isModalOpen && (
        <ProjectSubmissionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Home;
