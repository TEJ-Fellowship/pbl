import { useEffect, useState } from 'react'
import axios from 'axios'
import Modal from './Modal'
import ArticleCard from './ArticleCard'


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
        <ArticleCard key={index} article={article} onClick={setSelectedArticle} />
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
