import React, { useState } from "react";
import {
  BookOpen,
  Clock,
  Target,
  Zap,
  Brain,
  Star,
  ChevronRight,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";

const Tips = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [completedTips, setCompletedTips] = useState(new Set());

  const categories = [
    { id: "all", name: "All Tips", icon: BookOpen, color: "bg-blue-500" },
    { id: "memory", name: "Memory", icon: Brain, color: "bg-purple-500" },
    { id: "speed", name: "Speed Learning", icon: Zap, color: "bg-yellow-500" },
    { id: "focus", name: "Focus", icon: Target, color: "bg-green-500" },
    {
      id: "productivity",
      name: "Productivity",
      icon: TrendingUp,
      color: "bg-red-500",
    },
  ];

  const tips = [
    {
      id: 1,
      category: "memory",
      title: "The Feynman Technique",
      description:
        "Explain concepts in simple terms as if teaching a child. This reveals gaps in understanding.",
      details:
        "Choose a concept → Explain it simply → Identify gaps → Go back and study → Simplify again",
      difficulty: "Beginner",
      timeToMaster: "1 week",
      effectiveness: 95,
    },
    {
      id: 2,
      category: "memory",
      title: "Spaced Repetition",
      description:
        "Review information at increasing intervals to combat the forgetting curve.",
      details:
        "Review after 1 day → 3 days → 1 week → 2 weeks → 1 month → 3 months",
      difficulty: "Intermediate",
      timeToMaster: "2-3 weeks",
      effectiveness: 90,
    },
    {
      id: 3,
      category: "speed",
      title: "Active Recall",
      description:
        "Test yourself frequently instead of just re-reading. Force your brain to retrieve information.",
      details:
        "Close your book → Write what you remember → Check accuracy → Repeat with missed items",
      difficulty: "Beginner",
      timeToMaster: "3-5 days",
      effectiveness: 88,
    },
    {
      id: 4,
      category: "focus",
      title: "Pomodoro Technique",
      description:
        "Work in focused 25-minute intervals followed by 5-minute breaks.",
      details: "25 min work → 5 min break → Repeat 4 times → Take 30 min break",
      difficulty: "Beginner",
      timeToMaster: "1 week",
      effectiveness: 85,
    },
    {
      id: 5,
      category: "memory",
      title: "Memory Palace Method",
      description:
        "Associate information with familiar locations to create vivid mental maps.",
      details:
        "Choose familiar route → Place information at specific locations → Walk through mentally",
      difficulty: "Advanced",
      timeToMaster: "3-4 weeks",
      effectiveness: 92,
    },
    {
      id: 6,
      category: "speed",
      title: "Chunking Information",
      description:
        "Break complex information into smaller, manageable chunks for faster processing.",
      details:
        "Identify patterns → Group related items → Create meaningful connections → Practice recall",
      difficulty: "Intermediate",
      timeToMaster: "1-2 weeks",
      effectiveness: 87,
    },
    {
      id: 7,
      category: "productivity",
      title: "The 80/20 Rule",
      description:
        "Focus on the 20% of material that gives you 80% of the results.",
      details:
        "Identify key concepts → Prioritize high-impact topics → Minimize time on trivial details",
      difficulty: "Intermediate",
      timeToMaster: "1 week",
      effectiveness: 83,
    },
    {
      id: 8,
      category: "focus",
      title: "Deep Work Sessions",
      description:
        "Eliminate distractions and work on cognitively demanding tasks for extended periods.",
      details:
        "Choose important task → Remove all distractions → Work for 90-120 minutes → Take break",
      difficulty: "Advanced",
      timeToMaster: "2-3 weeks",
      effectiveness: 94,
    },
  ];

  const filteredTips =
    activeCategory === "all"
      ? tips
      : tips.filter((tip) => tip.category === activeCategory);

  const toggleTipCompletion = (tipId) => {
    const newCompleted = new Set(completedTips);
    if (newCompleted.has(tipId)) {
      newCompleted.delete(tipId);
    } else {
      newCompleted.add(tipId);
    }
    setCompletedTips(newCompleted);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "text-green-600 bg-green-100";
      case "Intermediate":
        return "text-yellow-600 bg-yellow-100";
      case "Advanced":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
                <Brain className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              Master Learning
              <span className="block text-yellow-300">10x Faster</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Discover scientifically-proven techniques used by top performers,
              memory champions, and learning experts to accelerate your
              knowledge acquisition.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-2 text-blue-200">
                <Users className="w-5 h-5" />
                <span>50,000+ learners</span>
              </div>
              <div className="flex items-center gap-2 text-blue-200">
                <Award className="w-5 h-5" />
                <span>Proven methods</span>
              </div>
              <div className="flex items-center gap-2 text-blue-200">
                <Star className="w-5 h-5" />
                <span>Expert curated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 -mt-8">
          {[
            { label: "Learning Techniques", value: "8+", icon: Lightbulb },
            { label: "Avg. Improvement", value: "300%", icon: TrendingUp },
            { label: "Time Saved", value: "60%", icon: Clock },
            { label: "Success Rate", value: "94%", icon: Target },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform"
            >
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 ${
                activeCategory === category.id
                  ? `${category.color} text-white shadow-lg`
                  : "bg-white text-gray-600 hover:bg-gray-50 shadow-md"
              }`}
            >
              <category.icon className="w-5 h-5" />
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tips Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredTips.map((tip) => (
            <div
              key={tip.id}
              className={`bg-white rounded-2xl shadow-xl border-l-4 border-blue-500 transform hover:scale-[1.02] transition-all duration-300 ${
                completedTips.has(tip.id) ? "ring-2 ring-green-400" : ""
              }`}
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-gray-800">
                        {tip.title}
                      </h3>
                      <button
                        onClick={() => toggleTipCompletion(tip.id)}
                        className={`p-1 rounded-full transition-colors ${
                          completedTips.has(tip.id)
                            ? "text-green-600 bg-green-100"
                            : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                        }`}
                      >
                        <CheckCircle className="w-6 h-6" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-lg leading-relaxed mb-4">
                      {tip.description}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    How to Apply:
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{tip.details}</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                        tip.difficulty
                      )}`}
                    >
                      {tip.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{tip.timeToMaster}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">
                      {tip.effectiveness}% effective
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Effectiveness Rate
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${tip.effectiveness}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {tip.effectiveness}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Your Learning Journey</h2>
            <p className="text-blue-100 mb-8">
              Track your progress and build effective learning habits
            </p>
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">Tips Mastered</span>
                <span className="text-2xl font-bold">
                  {completedTips.size} / {tips.length}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4 mb-4">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-500"
                  style={{
                    width: `${(completedTips.size / tips.length) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="text-blue-100">
                {completedTips.size === tips.length
                  ? "🎉 Congratulations! You've mastered all techniques!"
                  : `${
                      tips.length - completedTips.size
                    } more techniques to master`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Start applying these proven techniques today and see dramatic
            improvements in your learning speed and retention.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center gap-2">
              Start Learning Journey
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="border border-gray-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all">
              Download Study Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tips;
