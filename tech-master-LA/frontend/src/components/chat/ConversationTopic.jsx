// tech-master-LA/frontend/src/components/chat/ConversationTopic.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';

const ConversationTopic = ({ 
  conversations, 
  selectedId, 
  onSelect, 
  onDelete,
  isOpen, 
  onToggle,
  isLoading 
}) => {
    const handleDelete = (e, conversationId) => {
        e.stopPropagation(); // Prevent triggering the conversation selection
        onDelete(conversationId);
      };
  return (
    
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-4 z-50 p-1 bg-gray-800 border border-gray-700 rounded-full shadow-lg hover:bg-gray-700 transition-all"
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-gray-300" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-300" />
        )}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-[80vh] backdrop-blur-sm bg-gray-900/90 border-r border-gray-800/50 rounded-l-lg overflow-hidden"
          >
            <div className="p-4 border-b border-gray-800/50">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversations
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className="overflow-y-auto h-[calc(80vh-4rem)] custom-scrollbar">
                {conversations.map((conv) => (
                   <motion.div
                   key={conv._id}
                   className={`group relative border-b border-gray-800/30 ${
                     selectedId === conv._id
                       ? 'bg-gradient-to-r from-red-600/20 to-red-700/20 border-l-4 border-l-red-500'
                       : 'hover:bg-gray-800/50'
                   }`}
                 >
                   <button
                     onClick={() => onSelect(conv._id)}
                     className="w-full p-4 text-left"
                   >
                     <h3 className="text-white font-medium truncate">
                       {conv.topic || 'Untitled Conversation'}
                     </h3>
                     <p className="text-[10px] text-gray-400 mt-1">
                       {new Date(conv.updatedAt).toLocaleDateString()}
                     </p>
                     <p className="text-xs text-gray-500 mt-1 truncate">
                       {conv.messages?.[conv.messages.length - 1]?.content || 'No messages'}
                     </p>
                   </button>
                   
                   {/* Delete Button */}
                   <motion.button
                     initial={{ opacity: 0.6 }}
                     animate={{ opacity: 1,scale:0.8 }}
                     whileHover={{ opacity: 1 }}
                     className="absolute top-2 right-2 p-2 rounded-full bg-gray-800/80 text-red-500 hover:bg-gray-700 hover:text-red-100 transition-all group-hover:opacity-100"
                     onClick={(e) => handleDelete(e, conv._id)}
                     title="Delete conversation"
                   >
                     <Trash2 className="w-4 h-4" />
                   </motion.button>
                 </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

ConversationTopic.propTypes = {
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      topic: PropTypes.string,
      updatedAt: PropTypes.string.isRequired,
      messages: PropTypes.arrayOf(
        PropTypes.shape({
          content: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default ConversationTopic;