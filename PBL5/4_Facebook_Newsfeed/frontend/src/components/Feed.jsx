import { useState, useEffect } from 'react';
import { fetchFeed } from '../utils/api';
import PostCard from './PostCard';

const Feed = ({ userId, currentUserId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadFeed();
    }
  }, [userId]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const feedPosts = await fetchFeed(userId);
      setPosts(feedPosts);
    } catch (err) {
      console.error('Error loading feed:', err);
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = (postId, isLiked) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const likedBy = post.likedBy || [];
          if (isLiked) {
            // Add current user to likedBy if not already there
            if (!likedBy.some((user) => user.id === currentUserId)) {
              return {
                ...post,
                likedBy: [...likedBy, { id: currentUserId }],
              };
            }
          } else {
            // Remove current user from likedBy
            return {
              ...post,
              likedBy: likedBy.filter((user) => user.id !== currentUserId),
            };
          }
        }
        return post;
      })
    );
  };

  const handleCommentAdded = (postId, newComment) => {
    // Comment is already added via state in PostCard, but we can refresh if needed
    // This is handled locally in PostCard component
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadFeed}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No posts to show</p>
        <p className="text-gray-400 text-sm mt-2">
          Follow some users to see their posts in your feed!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onLikeToggle={handleLikeToggle}
          onCommentAdded={handleCommentAdded}
        />
      ))}
    </div>
  );
};

export default Feed;

