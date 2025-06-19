import { useState } from "react";
import ProjectSubmissionModal from "../components/projects/ProjectSubmissionModal";

// Icons
const TrendingIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.53.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042.815a.75.75 0 01-.919-.53z"
      clipRule="evenodd"
    />
  </svg>
);

const EyeIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    <path
      fillRule="evenodd"
      d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
      clipRule="evenodd"
    />
  </svg>
);

const HeartIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.59L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
      clipRule="evenodd"
    />
  </svg>
);

const ProjectCard = ({ project }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Project Image */}
      <div className="relative aspect-video bg-gray-100">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-12 w-12 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            Week {project.week}
          </span>
          {project.featured && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              Featured
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="absolute right-3 top-3 flex items-center gap-3 text-white">
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
            <HeartIcon /> <span>{project.likes}</span>
          </div>
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
            <EyeIcon /> <span>{project.views}</span>
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
          className="mt-2 text-sm text-gray-600 overflow-hidden"
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
                    className="h-8 w-8 rounded-full ring-2 ring-white"
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
        <div className="mt-4 flex flex-wrap gap-2">
          {project.technologies.map((tech, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3">
          <a
            href={project.codeUrl}
            className="flex-1 bg-indigo-500 text-white text-center px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
          >
            Code
          </a>
          <a
            href={project.demoUrl}
            className="flex-1 bg-gray-100 text-gray-900 text-center px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
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
  const [projects] = useState([
    {
      id: 1,
      title: "EcoTracker",
      description:
        "A sustainability app that helps users track their carbon footprint and suggests eco-friendly alternatives with real-time monitoring.",
      difficulty: "Advanced",
      week: 8,
      featured: true,
      likes: 42,
      views: 156,
      team: [
        {
          name: "Sarah Chen",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        },
        {
          name: "Mike Johnson",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
        },
        {
          name: "Alex Kim",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        },
      ],
      technologies: ["React", "Node.js", "MongoDB", "Chart.js"],
      timeAgo: "2 weeks",
      codeUrl: "#",
      demoUrl: "#",
    },
    {
      id: 2,
      title: "TaskFlow",
      description:
        "A collaborative project management tool with real-time updates and team communication features.",
      difficulty: "Intermediate",
      week: 12,
      likes: 38,
      views: 203,
      team: [
        {
          name: "Marcus Rodriguez",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
        },
        {
          name: "Anna Kim",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna",
        },
      ],
      technologies: ["Vue.js", "Express", "PostgreSQL", "Socket.io"],
      timeAgo: "1 week",
      codeUrl: "#",
      demoUrl: "#",
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Stats Banner */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium">
            <TrendingIcon />
            <span>1,247 projects submitted this week</span>
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
                  6
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

          <div className="mt-4 flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search projects, technologies, or authors..."
                className="w-full rounded-lg border-0 bg-white px-4 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              />
            </div>
            <button className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg text-gray-900 hover:bg-gray-200 transition-colors">
              <FilterIcon />
              Filters
            </button>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        <ProjectSubmissionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Home;
