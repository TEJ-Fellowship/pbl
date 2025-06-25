import React from "react";
import { MapPin, Star, Heart, MessageCircle, Users } from "lucide-react";

const TaskCard = ({ task, categories }) => {
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return "🔓";
      case "in-progress":
        return "⏳";
      case "completed":
        return "✅";
      default:
        return "🔓";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xl">
            {task.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{task.user}</h3>
                <p className="text-sm text-gray-500">{task.time}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(
                    task.urgency
                  )}`}
                >
                  {task.urgency} priority
                </span>
                <span className="text-lg">{getStatusIcon(task.status)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">
              {categories.find((c) => c.id === task.category)?.icon}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                categories.find((c) => c.id === task.category)?.color
              }`}
            >
              {categories.find((c) => c.id === task.category)?.name}
            </span>
          </div>

          <h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>
          <p className="text-gray-700 mb-3">{task.description}</p>

          <div className="flex items-center text-sm text-gray-500 space-x-4 mb-3">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{task.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{task.karma} karma</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{task.likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{task.comments}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{task.helpers} helpers</span>
            </div>
          </div>

          <div className="flex space-x-2">
            {task.status === "open" && (
              <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-green-600 hover:to-green-700 transition-colors">
                I can help!
              </button>
            )}
            {task.status === "in-progress" && (
              <button className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                In Progress
              </button>
            )}
            {task.status === "completed" && (
              <button className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                Completed ✨
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default TaskCard;
