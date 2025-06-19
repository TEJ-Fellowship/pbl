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
      className="max-w-2xl mx-auto bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100 shadow-xl border border-purple-200 rounded-3xl p-6 mb-8"
    >
      <motion.h2
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-extrabold text-center text-purple-700 mb-4 flex items-center justify-center gap-2"
      >
        <Sparkles className="text-purple-500" size={26} />
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
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
