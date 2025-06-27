import React, { useState } from "react";
import {
  Heart,
  MapPin,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  Star,
  CheckCircle,
  Users,
} from "lucide-react";

const AvailableSupport = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState("dashboard");
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Help with grocery shopping",
      description: "Need someone to pick up groceries for elderly parent",
      category: "Shopping",
      urgency: "Medium",
      location: "Downtown Area",
      requester: "Sarah Chen",
      status: "Open",
      postedDate: "2024-06-20",
      karma: 15,
    },
    {
      id: 2,
      title: "Dog walking assistance",
      description:
        "Going out of town, need someone to walk my golden retriever",
      category: "Pet Care",
      urgency: "High",
      location: "Maple Street",
      requester: "Mike Johnson",
      status: "In Progress",
      postedDate: "2024-06-19",
      karma: 20,
      helper: "Emma Davis",
    },
    {
      id: 3,
      title: "Tech setup help",
      description: "Need help setting up new smart TV and streaming services",
      category: "Technology",
      urgency: "Low",
      location: "Oak Avenue",
      requester: "Robert Wilson",
      status: "Open",
      postedDate: "2024-06-18",
      karma: 10,
    },
  ]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "",
    urgency: "",
    location: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const categories = [
    "All",
    "Shopping",
    "Pet Care",
    "Technology",
    "Transportation",
    "Household",
    "Childcare",
  ];
  const urgencyLevels = ["Low", "Medium", "High"];

  // Mock users for demo
  const users = {
    helper: {
      name: "Alex Thompson",
      karma: 150,
      tasksCompleted: 23,
      role: "Helper",
    },
    requester: {
      name: "Jessica Martinez",
      karma: 85,
      tasksPosted: 12,
      role: "Requester",
    },
  };

  // AI-powered category and urgency suggestion (mock implementation)
  const suggestCategoryAndUrgency = (description) => {
    const keywords = description.toLowerCase();
    let suggestedCategory = "Household";
    let suggestedUrgency = "Medium";

    if (
      keywords.includes("grocery") ||
      keywords.includes("shopping") ||
      keywords.includes("store")
    ) {
      suggestedCategory = "Shopping";
    } else if (
      keywords.includes("dog") ||
      keywords.includes("pet") ||
      keywords.includes("cat")
    ) {
      suggestedCategory = "Pet Care";
    } else if (
      keywords.includes("tech") ||
      keywords.includes("computer") ||
      keywords.includes("phone")
    ) {
      suggestedCategory = "Technology";
    } else if (
      keywords.includes("drive") ||
      keywords.includes("ride") ||
      keywords.includes("transport")
    ) {
      suggestedCategory = "Transportation";
    } else if (
      keywords.includes("child") ||
      keywords.includes("baby") ||
      keywords.includes("kid")
    ) {
      suggestedCategory = "Childcare";
    }

    if (
      keywords.includes("urgent") ||
      keywords.includes("asap") ||
      keywords.includes("emergency")
    ) {
      suggestedUrgency = "High";
    } else if (
      keywords.includes("whenever") ||
      keywords.includes("no rush") ||
      keywords.includes("flexible")
    ) {
      suggestedUrgency = "Low";
    }

    return { category: suggestedCategory, urgency: suggestedUrgency };
  };

  const handleDescriptionChange = (description) => {
    setNewTask((prev) => ({ ...prev, description }));

    if (description.length > 10) {
      const suggestions = suggestCategoryAndUrgency(description);
      setNewTask((prev) => ({
        ...prev,
        category: prev.category || suggestions.category,
        urgency: prev.urgency || suggestions.urgency,
      }));
    }
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.description) return;

    const task = {
      id: Date.now(),
      ...newTask,
      requester: currentUser?.name || "Anonymous",
      status: "Open",
      postedDate: new Date().toISOString().split("T")[0],
      karma: Math.floor(Math.random() * 25) + 5,
    };

    setTasks((prev) => [task, ...prev]);
    setNewTask({
      title: "",
      description: "",
      category: "",
      urgency: "",
      location: "",
    });
    setCurrentView("dashboard");
  };

  const claimTask = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: "In Progress", helper: currentUser?.name }
          : task
      )
    );
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-orange-100 text-orange-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "All" || task.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const LoginScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-orange-400 to-pink-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            NeighborHelp
          </h1>
          <p className="text-gray-600">
            Building stronger communities, one favor at a time
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setCurrentUser(users.helper)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
          >
            Join as Helper 🤝
          </button>
          <button
            onClick={() => setCurrentUser(users.requester)}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
          >
            Join as Requester 🙋‍♀️
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            Connect with neighbors • Share kindness • Build community
          </p>
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <header className="bg-white shadow-sm border-b-2 border-orange-100">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-orange-400 to-pink-400 w-10 h-10 rounded-full flex items-center justify-center">
              <Heart className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">NeighborHelp</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-50 to-pink-50 px-4 py-2 rounded-full">
              <Star className="text-orange-500" size={16} />
              <span className="font-semibold text-gray-700">
                {currentUser?.karma}
              </span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800">{currentUser?.name}</p>
              <p className="text-sm text-gray-600">{currentUser?.role}</p>
            </div>
            <button
              onClick={() => setCurrentUser(null)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  const Navigation = () => (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex space-x-8">
          {["dashboard", "browse", "post"].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`py-4 px-2 font-medium text-sm transition-colors relative ${
                currentView === view
                  ? "text-orange-600 border-b-2 border-orange-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {view === "dashboard" && "Dashboard"}
              {view === "browse" && "Browse Tasks"}
              {view === "post" && "Post Task"}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );

  const Dashboard = () => (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {currentUser?.name}! 👋
        </h2>
        <p className="text-gray-600">
          Ready to make a difference in your community?
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">My Impact</h3>
            <Users className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">
            {currentUser?.role === "Helper"
              ? currentUser?.tasksCompleted
              : currentUser?.tasksPosted}
          </p>
          <p className="text-sm text-gray-600">
            {currentUser?.role === "Helper"
              ? "Tasks Completed"
              : "Tasks Posted"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Karma Points</h3>
            <Star className="text-orange-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-1">
            {currentUser?.karma}
          </p>
          <p className="text-sm text-gray-600">Community Points</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Active Tasks</h3>
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">
            {
              tasks.filter(
                (t) =>
                  t.status === "In Progress" &&
                  (currentUser?.role === "Helper"
                    ? t.helper === currentUser?.name
                    : t.requester === currentUser?.name)
              ).length
            }
          </p>
          <p className="text-sm text-gray-600">In Progress</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {tasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
            >
              <div>
                <h4 className="font-semibold text-gray-800">{task.title}</h4>
                <p className="text-sm text-gray-600">{task.location}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  task.status
                )}`}
              >
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const BrowseTasks = () => (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Browse Community Tasks
        </h2>
        <p className="text-gray-600">Find ways to help your neighbors</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-2">{task.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{task.description}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin size={16} className="mr-2" />
                {task.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock size={16} className="mr-2" />
                {task.postedDate}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <User size={16} className="mr-2" />
                {task.requester}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(
                  task.urgency
                )}`}
              >
                {task.urgency} Priority
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  task.status
                )}`}
              >
                {task.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-orange-600">
                <Star size={16} className="mr-1" />
                {task.karma} karma
              </div>

              {currentUser?.role === "Helper" && task.status === "Open" && (
                <button
                  onClick={() => claimTask(task.id)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all"
                >
                  Help Out
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PostTask = () => (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Post a New Task
        </h2>
        <p className="text-gray-600">
          Let your community know how they can help
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="What do you need help with?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={newTask.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent h-32"
              placeholder="Provide more details about what you need..."
              required
            />
            {newTask.description.length > 10 && (
              <p className="text-sm text-blue-600 mt-1">
                💡 AI suggested:{" "}
                {suggestCategoryAndUrgency(newTask.description).category}{" "}
                category,{" "}
                {suggestCategoryAndUrgency(newTask.description).urgency}{" "}
                priority
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={newTask.category}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {categories.slice(1).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                value={newTask.urgency}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, urgency: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select priority</option>
                {urgencyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={newTask.location}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Where is this task located?"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
          >
            Post Task
          </button>
        </div>
      </div>
    </div>
  );

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      <Header />
      <Navigation />

      {currentView === "dashboard" && <Dashboard />}
      {currentView === "browse" && <BrowseTasks />}
      {currentView === "post" && <PostTask />}
    </div>
  );
};

export default AvailableSupport;
