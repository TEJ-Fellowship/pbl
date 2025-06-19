import React, { useState } from "react";
import { Search, Play, CheckCircle } from "lucide-react";

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

export default LearningPortal;
