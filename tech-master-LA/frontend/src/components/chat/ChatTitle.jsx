import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const ChatTitle = () => {
  return (
    <motion.h2
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2 }}
    className="text-3xl font-extrabold text-center
    
    text-white mb-4 flex items-center justify-center gap-2"
  >
    <Sparkles className="text-white" size={26} />
    <span className="bg-gradient-to-t from-red-500 to-white bg-clip-text text-transparent">
        AI Chat Assistant
      </span>
  </motion.h2>
  )
}

export default ChatTitle
