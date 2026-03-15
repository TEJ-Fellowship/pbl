import React, { useState } from "react";
import {
  Book,
  MessageCircle,
  Brain,
  TrendingUp,
  User,
  Settings,
  Search,
  Play,
  CheckCircle,
  Clock,
  Award,
} from "lucide-react";

const DummyPage = () => {
  const [currentPage, setCurrentPage] = useState("learning");

  const NavButton = ({ page, icon: Icon, label, isActive }) => (
    <button
      onClick={() => setCurrentPage(page)}
      className={`flex flex-col items-center p-3 rounded-lg transition-all ${
        isActive
          ? "bg-red-500 text-white"
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`}
    >
      <Icon size={24} />
      <span className="text-xs mt-1">{label}</span>
    </button>
  );

  const LearningPortal = () => (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Learning Portal
            </h1>
            <p className="text-gray-400">Continue your learning journey</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search courses..."
                className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
              />
            </div>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
              New Course
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "React Fundamentals",
              progress: 75,
              lessons: 24,
              duration: "8h 30m",
            },
            {
              title: "JavaScript Advanced",
              progress: 45,
              lessons: 32,
              duration: "12h 15m",
            },
            {
              title: "Node.js Backend",
              progress: 20,
              lessons: 28,
              duration: "10h 45m",
            },
            {
              title: "Python for AI",
              progress: 90,
              lessons: 20,
              duration: "6h 20m",
            },
            {
              title: "Database Design",
              progress: 60,
              lessons: 18,
              duration: "7h 10m",
            },
            {
              title: "DevOps Essentials",
              progress: 30,
              lessons: 25,
              duration: "9h 30m",
            },
          ].map((course, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-red-500 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">
                  {course.title}
                </h3>
                <Play className="text-red-500" size={20} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{course.lessons} lessons</span>
                  <span>{course.duration}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">
                    {course.progress}% complete
                  </span>
                  <button className="text-red-500 hover:text-red-400 text-sm font-medium">
                    Continue
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-white text-xl font-semibold mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {[
              {
                action: "Completed lesson",
                course: "React Fundamentals",
                time: "2 hours ago",
              },
              {
                action: "Started new course",
                course: "Python for AI",
                time: "1 day ago",
              },
              {
                action: "Passed quiz",
                course: "JavaScript Advanced",
                time: "2 days ago",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-3 bg-gray-900 rounded-lg"
              >
                <CheckCircle className="text-green-500" size={20} />
                <div className="flex-1">
                  <p className="text-white">
                    {activity.action} in{" "}
                    <span className="text-red-500">{activity.course}</span>
                  </p>
                  <p className="text-gray-400 text-sm">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const AIChat = () => (
    <div className="flex-1 flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">AI Study Assistant</h1>
        <p className="text-gray-400">Get instant help with your studies</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        <div className="bg-gray-800 rounded-xl p-4 max-w-md">
          <p className="text-white">
            Hello! I'm your AI study companion. How can I help you today?
          </p>
        </div>

        <div className="bg-red-500 rounded-xl p-4 max-w-md ml-auto">
          <p className="text-white">Can you explain how React hooks work?</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 max-w-2xl">
          <p className="text-white mb-3">
            React hooks are functions that let you use state and other React
            features in functional components. Here are the key points:
          </p>
          <ul className="text-gray-300 space-y-2">
            <li>• useState: Manages component state</li>
            <li>• useEffect: Handles side effects</li>
            <li>• useContext: Accesses context values</li>
          </ul>
          <p className="text-white mt-3">
            Would you like me to explain any specific hook in detail?
          </p>
        </div>
      </div>

      <div className="p-6 border-t border-gray-700">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Ask me anything about your studies..."
            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
          />
          <button className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );

  const SmartQuizzes = () => (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Smart Quizzes
            </h1>
            <p className="text-gray-400">
              Test your knowledge with adaptive quizzes
            </p>
          </div>
          <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
            Create Quiz
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            {
              title: "React Components Quiz",
              questions: 15,
              difficulty: "Intermediate",
              completed: true,
              score: 85,
            },
            {
              title: "JavaScript ES6 Features",
              questions: 20,
              difficulty: "Advanced",
              completed: false,
              score: null,
            },
            {
              title: "CSS Flexbox & Grid",
              questions: 12,
              difficulty: "Beginner",
              completed: true,
              score: 92,
            },
            {
              title: "Node.js Fundamentals",
              questions: 18,
              difficulty: "Intermediate",
              completed: false,
              score: null,
            },
          ].map((quiz, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-red-500 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">
                  {quiz.title}
                </h3>
                <Brain className="text-red-500" size={20} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {quiz.questions} questions
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      quiz.difficulty === "Beginner"
                        ? "bg-green-900 text-green-300"
                        : quiz.difficulty === "Intermediate"
                        ? "bg-yellow-900 text-yellow-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {quiz.difficulty}
                  </span>
                </div>
                {quiz.completed ? (
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 text-sm flex items-center">
                      <CheckCircle size={16} className="mr-1" />
                      Completed
                    </span>
                    <span className="text-white font-semibold">
                      {quiz.score}%
                    </span>
                  </div>
                ) : (
                  <button className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors">
                    Start Quiz
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-white text-xl font-semibold mb-4">
            Quiz Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">12</div>
              <div className="text-gray-400">Quizzes Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">87%</div>
              <div className="text-gray-400">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">45h</div>
              <div className="text-gray-400">Study Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TrackProgress = () => (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Track Progress
            </h1>
            <p className="text-gray-400">Monitor your learning journey</p>
          </div>
          <div className="flex space-x-4">
            <select className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Courses Completed",
              value: "8",
              change: "+2",
              icon: CheckCircle,
              color: "text-green-500",
            },
            {
              label: "Study Hours",
              value: "47",
              change: "+5",
              icon: Clock,
              color: "text-blue-500",
            },
            {
              label: "Quizzes Passed",
              value: "23",
              change: "+7",
              icon: Brain,
              color: "text-purple-500",
            },
            {
              label: "Achievements",
              value: "12",
              change: "+1",
              icon: Award,
              color: "text-yellow-500",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={stat.color} size={24} />
                <span className="text-green-400 text-sm">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white text-lg font-semibold mb-4">
              Learning Streak
            </h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500 mb-2">15</div>
              <div className="text-gray-400">Days in a row</div>
              <div className="mt-4 flex justify-center space-x-2">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded ${
                      i < 5 ? "bg-red-500" : "bg-gray-700"
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white text-lg font-semibold mb-4">
              Skills Progress
            </h3>
            <div className="space-y-4">
              {[
                { skill: "React", level: 85 },
                { skill: "JavaScript", level: 78 },
                { skill: "Node.js", level: 65 },
                { skill: "Python", level: 42 },
              ].map((skill, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white">{skill.skill}</span>
                    <span className="text-gray-400">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white text-lg font-semibold mb-4">
            Recent Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "React Master",
                description: "Completed all React courses",
                date: "2 days ago",
              },
              {
                title: "Quiz Champion",
                description: "Scored 90%+ on 5 quizzes",
                date: "1 week ago",
              },
              {
                title: "Consistent Learner",
                description: "7-day learning streak",
                date: "2 weeks ago",
              },
            ].map((achievement, index) => (
              <div
                key={index}
                className="bg-gray-900 rounded-lg p-4 flex items-center space-x-4"
              >
                <Award className="text-yellow-500" size={24} />
                <div>
                  <div className="text-white font-medium">
                    {achievement.title}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {achievement.description}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {achievement.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "learning":
        return <LearningPortal />;
      case "chat":
        return <AIChat />;
      case "quizzes":
        return <SmartQuizzes />;
      case "progress":
        return <TrackProgress />;
      default:
        return <LearningPortal />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-red-500 rounded-full relative">
              <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full transform translate-x-1 -translate-y-1"></div>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold">TechMaster</h1>
            <p className="text-gray-400 text-sm">
              Your AI-powered study companion
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white">
            <Settings size={20} />
          </button>
          <button className="text-gray-400 hover:text-white">
            <User size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {renderCurrentPage()}

      {/* Bottom Navigation */}
      <div className="flex justify-around p-4 bg-gray-900 border-t border-gray-800">
        <NavButton
          page="learning"
          icon={Book}
          label="Learning Portal"
          isActive={currentPage === "learning"}
        />
        <NavButton
          page="chat"
          icon={MessageCircle}
          label="AI Chat"
          isActive={currentPage === "chat"}
        />
        <NavButton
          page="quizzes"
          icon={Brain}
          label="Smart Quizzes"
          isActive={currentPage === "quizzes"}
        />
        <NavButton
          page="progress"
          icon={TrendingUp}
          label="Track Progress"
          isActive={currentPage === "progress"}
        />
      </div>
    </div>
  );
};

export default DummyPage;
