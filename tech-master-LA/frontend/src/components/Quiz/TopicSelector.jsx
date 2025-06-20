// tech-master-LA/frontend/src/components/Quiz/TopicSelector.jsx
import React from 'react';

const topics = [
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "Data Structures",
  "Algorithms",
  "Web Development",
  "Database Design",
  "System Design",
  "Machine Learning"
];

const TopicSelector = ({ onSelectTopic }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {topics.map((topic) => (
        <button
          key={topic}
          onClick={() => onSelectTopic(topic)}
          className="px-4 py-2 text-sm bg-gray-800 text-gray-200 border border-gray-700 
          rounded-lg hover:bg-gray-700 hover:border-red-500 transition-all duration-200 
          hover:text-red-400 shadow-md hover:shadow-lg hover:shadow-blue-500/10"
        >
          {topic}
        </button>
      ))}
    </div>
  );
};

export default TopicSelector;