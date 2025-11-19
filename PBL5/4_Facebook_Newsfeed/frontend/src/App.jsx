import { useState, useEffect } from 'react'

function App() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/feed')
      const data = await response.json()
      setPosts(data.posts || data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([
        {
          id: 1,
          author: { username: 'John Doe' },
          content: 'This is a sample post!',
          created_at: new Date().toISOString(),
          likes_count: 5,
          comments: [
            { id: 1, author: { username: 'Jane' }, content: 'Nice post!', created_at: new Date().toISOString() }
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-5 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Newsfeed</h1>
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No posts yet</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-900">
                  {post.author?.username || post.username || 'Unknown'}
                </span>
                <span className="text-sm text-gray-500">{formatTime(post.created_at)}</span>
              </div>
              <div className="text-gray-800 mb-4 leading-relaxed">{post.content}</div>
              <div className="flex gap-4 pt-3 border-t border-gray-100 text-sm text-gray-600">
                <span>❤️ {post.likes_count || 0}</span>
                <span>💬 {post.comments_count || post.comments?.length || 0}</span>
              </div>
              {post.comments && post.comments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="text-sm">
                      <span className="font-semibold text-gray-900">
                        {comment.author?.username || comment.username}:
                      </span>
                      <span className="text-gray-700 ml-1">{comment.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App