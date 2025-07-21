import { useEffect, useState } from 'react'
import axios from 'axios'
import Modal from './Modal'
import ArticleCard from './ArticleCard'
import Navbar from './NavBar'

const NewsFeed = () => {
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('/api/news')
        setArticles(response.data.articles)
        setFilteredArticles(response.data.articles) // initially show all
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  const handleSearch = (keyword) => {
    const lowerKeyword = keyword.toLowerCase()
    const filtered = articles.filter(article =>
      article.title?.toLowerCase().includes(lowerKeyword) ||
      article.description?.toLowerCase().includes(lowerKeyword)
    )
    setFilteredArticles(filtered)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <div className="animate-spin text-4xl">📰</div>
        <p className="mt-4 text-gray-600 text-lg">Fetching fresh headlines...</p>
      </div>
    )
  }

  return (
    <>
      {/* ✅ Add Navbar with search */}
      <Navbar onSearch={handleSearch} />

      <div className="news-feed grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-9 p-4">
        {filteredArticles.map((article, index) => (
          <ArticleCard key={index} article={article} onClick={setSelectedArticle} />
        ))}

        <Modal
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
          article={selectedArticle}
        />
      </div>
    </>
  )
}

export default NewsFeed
