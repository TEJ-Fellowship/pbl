import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const ChatTitle = ({ currentTopic }) => {
  return (
    <motion.h2
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="text-xl font-bold text-center text-white flex items-center gap-2"
    >
      <Sparkles className="text-white" size={22} />
      <span className="bg-red-500 bg-clip-text text-transparent">
        {currentTopic || "AI Chat Assistant"}
      </span>
    </motion.h2>
  );
};

export default ChatTitle;
