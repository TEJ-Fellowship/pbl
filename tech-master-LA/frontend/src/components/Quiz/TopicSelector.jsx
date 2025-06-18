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
          className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
        >
          {topic}
        </button>
      ))}
    </div>
  );
};

export default TopicSelector;