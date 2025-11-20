const API_BASE_URL = 'http://localhost:3000/api';

// Fetch feed for a user
export const fetchFeed = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/feed/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch feed');
  const data = await response.json();
  return data.posts || [];
};

// Like or unlike a post
export const toggleLike = async (postId, userId) => {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!response.ok) throw new Error('Failed to toggle like');
  return await response.json();
};

// Add a comment to a post
export const addComment = async (postId, userId, content) => {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, content }),
  });
  if (!response.ok) throw new Error('Failed to add comment');
  return await response.json();
};

// Create a new post
export const createPost = async (userId, content) => {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, content }),
  });
  if (!response.ok) throw new Error('Failed to create post');
  return await response.json();
};

