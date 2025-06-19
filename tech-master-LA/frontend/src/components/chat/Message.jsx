// tech-master-LA/frontend/src/components/chat/Message.jsx
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import MessageContent from './MessageContent';

const Message = ({ message, index }) => {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] p-4 rounded-lg ${
          message.role === 'user'
          ? '  bg-red-500  text-white shadow-lg' // Darker blue for user messages
          : 'bg-gray-50 dark:bg-gray-800 shadow-md ' // Lighter background for AI messages
        }`}
      >
        <MessageContent content={message.content} role={message.role} />
      </div>
    </motion.div>
  );
};

Message.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

export default Message;