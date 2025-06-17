// tech-master-LA/frontend/src/components/Quiz/QuizGenerator.jsx
import TopicSelector from "./TopicSelector";
import { useState } from "react";

const QuizGenerator = ({ onGenerate, isLoading }) => {  // Add isLoading prop
  const [selectedTopic, setSelectedTopic] = useState(null);

  const handleGenerate = () => {
    if (selectedTopic && !isLoading) {
      onGenerate(selectedTopic);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Generate New Quiz</h2>
      <TopicSelector onSelectTopic={setSelectedTopic} disabled={isLoading} />
      <button
        onClick={handleGenerate}
        disabled={!selectedTopic || isLoading}
        className={`px-6 py-2 rounded-full ${
          selectedTopic && !isLoading
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Generating...' : 'Generate Quiz'}
      </button>
    </div>
  );
};

export default QuizGenerator;