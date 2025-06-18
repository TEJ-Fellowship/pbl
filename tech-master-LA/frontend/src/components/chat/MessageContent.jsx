// tech-master-LA/frontend/src/components/chat/MessageContent.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PropTypes from 'prop-types';

const MarkdownComponents = {
  // Regular paragraph text
  p: ({ children }) => (
    <p className="mb-2 text-gray-800 dark:text-gray-200">{children}</p>
  ),
  // Headings with dark blue color
  h1: ({ children }) => (
    <h1 className="text-xl font-bold mb-2 text-blue-900 dark:text-blue-300">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-300">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-md font-bold mb-2 text-blue-700 dark:text-blue-300">{children}</h3>
  ),
  // Lists with better contrast
  ul: ({ children }) => (
    <ul className="list-disc ml-4 mb-2 text-blue-800 dark:text-blue-200">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal ml-4 mb-2 text-blue-800 dark:text-blue-200">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="mb-1 text-blue-800 dark:text-blue-200">{children}</li>
  ),
  // Code blocks with better background contrast
  code: ({ children }) => (
    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-blue-600 dark:text-blue-300">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded mb-2 overflow-x-auto text-gray-800 dark:text-gray-200">
      {children}
    </pre>
  ),
  // Bold text in dark blue
  strong: ({ children }) => (
    <strong className="font-bold text-blue-900 dark:text-blue-300">{children}</strong>
  ),
  // Italic text in dark gray
  em: ({ children }) => (
    <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
  ),
  // Blockquotes with brown/sepia tone
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-brown-400 pl-4 italic mb-2 text-brown-800 dark:text-brown-200 bg-brown-50 dark:bg-brown-900/10 py-2 rounded">
      {children}
    </blockquote>
  ),
};

const MessageContent = ({ content, role }) => {
  if (role === 'user') {
    return (
      <div className="whitespace-pre-wrap text-white font-medium">
        {content}
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <div className="text-gray-800 dark:text-gray-200"> {/* Added wrapper for default text color */}
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={MarkdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

MessageContent.propTypes = {
  content: PropTypes.string.isRequired,
  role: PropTypes.oneOf(['user', 'assistant']).isRequired,
};

export default MessageContent;