import { useState } from 'react';
import { addComment } from '../utils/api';

const CommentInput = ({ postId, currentUserId, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isLoading || !currentUserId) return;

    setIsLoading(true);
    try {
      const response = await addComment(postId, currentUserId, content.trim());
      setContent('');
      if (onCommentAdded) {
        onCommentAdded(response.comment);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 mt-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="flex-1 px-4 py-2 bg-gray-100 rounded-full border-none outline-none focus:bg-gray-200 transition-colors text-sm"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!content.trim() || isLoading}
        className={`px-4 py-2 bg-blue-600 text-white rounded-full font-medium text-sm transition-colors ${
          !content.trim() || isLoading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
};

export default CommentInput;

