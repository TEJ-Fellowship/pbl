// src/components/NewsFeed.jsx
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
    <div className="news-feed">
      {articles.map((article, index) => (
        <div className="news-card" key={index} onClick={() => setSelectedArticle(article)}>
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
          <h2>{article.title}</h2>
          <p><strong>{article.source.name}</strong> – {new Date(article.publishedAt).toLocaleDateString()}</p>
        </div>
      ))}

      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        article={selectedArticle}
      />
    </div>
  )
}

export default NewsFeed
