import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import TopicSelector from "./TopicSelector";

const QuizGenerator = ({ onGenerate, isLoading }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [creatorName, setCreatorName] = useState("");

  const handleGenerate = () => {
    if (selectedTopic && !isLoading) {
      onGenerate(selectedTopic, creatorName);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-2xl mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 
      shadow-xl border border-gray-700 rounded-3xl p-6 mb-8"
    >
      <motion.h2
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-extrabold text-center text-red-400 mb-4 flex items-center justify-center gap-2"
      >
        <Sparkles className="text-red-500" size={26} />
        Generate New Quiz
      </motion.h2>

      <div className="mb-6">
        <TopicSelector onSelectTopic={setSelectedTopic} disabled={isLoading} />
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Enter your name (optional)"
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-700 backdrop-blur-sm bg-gray-800/80 text-gray-200 
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent 
          placeholder-gray-500"
          disabled={isLoading}
        />
      </div>

      <div className="text-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerate}
          disabled={!selectedTopic || isLoading}
          className={`px-6 py-2.5 rounded-full text-base font-semibold shadow-md transition-all duration-300 
            ${
              selectedTopic && !isLoading
                ? "bg-gradient-to-r from-red-600 to-red-400 text-white hover:from-red-700 hover:to-red-500 shadow-lg shadow-red-500/20"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {isLoading ? "Generating..." : "✨ Generate Quiz"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default QuizGenerator;
