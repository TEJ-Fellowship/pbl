import { useEffect, useState } from 'react'
import axios from 'axios'
import Modal from './Modal'

const NewsFeed = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('/api/news')
        setArticles(response.data.articles)
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <div className="animate-spin text-4xl">📰</div>
      <p className="mt-4 text-gray-600 text-lg">Fetching fresh headlines...</p>
    </div>
  )

  return (
    <div className="news-feed grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-9 p-4">
      {articles.map((article, index) => (
        <div
          className="bg-white border rounded-lg shadow-md w-96 mx-auto overflow-hidden cursor-pointer hover:shadow-lg transition"
          key={index}
          onClick={() => setSelectedArticle(article)}
        >
          {/* Image Section */}
          <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
            {article.urlToImage ? (
              <img
                src={article.urlToImage}
                alt={article.title || "news"}
                width="300"
                onError={(e) => { e.target.src = '/fallback.jpg' }}
              />
            ) : (
              <div className="w-[300px] h-[200px] bg-gray-200 flex items-center justify-center text-gray-500 italic">
                No image
              </div>
            )}


          </div>
          {/* Content Section */}
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{article.title}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">{article.description}</p>
            <p className="text-gray-500 text-xs font-medium">
              {article.source?.name || "Unknown Source"}
            </p>
          </div>
        </div>
      ))}

      {/* Modal for viewing article details */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        article={selectedArticle}
      />
    </div>
  )
}

export default NewsFeed
