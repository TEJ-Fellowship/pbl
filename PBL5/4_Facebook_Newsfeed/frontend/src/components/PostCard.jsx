import { useState } from 'react';
import LikeButton from './LikeButton';
import Comment from './Comment';
import CommentInput from './CommentInput';

const PostCard = ({ post, currentUserId, onLikeToggle, onCommentAdded }) => {
  const [comments, setComments] = useState(post.comments || []);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleCommentAdded = (newComment) => {
    setComments([newComment, ...comments]);
    if (onCommentAdded) {
      onCommentAdded(post.id, newComment);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-4">
      {/* Post Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {post.author?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">
                {post.author?.username || 'Unknown User'}
              </h3>
              <span className="text-gray-500 text-sm">•</span>
              <span className="text-gray-500 text-sm">{formatTime(post.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-4">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Like Count and Comment Count */}
      <div className="px-4 pb-3 border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{post.likedBy?.length || 0} likes</span>
            <span>{comments.length} comments</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-2 border-t border-gray-200 pt-2">
        <div className="flex items-center">
          <LikeButton
            post={post}
            currentUserId={currentUserId}
            onLikeToggle={onLikeToggle}
          />
        </div>
      </div>

      {/* Comments Section */}
      <div className="px-4 pb-4 border-t border-gray-200 pt-3">
        {comments.length > 0 && (
          <div className="space-y-1 mb-3 max-h-64 overflow-y-auto">
            {comments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))}
          </div>
        )}
        <CommentInput
          postId={post.id}
          currentUserId={currentUserId}
          onCommentAdded={handleCommentAdded}
        />
      </div>
    </div>
  );
};

export default PostCard;

