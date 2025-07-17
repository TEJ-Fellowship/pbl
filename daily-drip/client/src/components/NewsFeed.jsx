import { useEffect, useState } from 'react'
import axios from 'axios'

const NewsFeed = () => {
    const [articles, setArticles] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/news')
                setArticles(response.data.articles)
            } catch (error) {
                console.error('Error fetching news:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchNews()
    }, [])

    if (loading) return <div>Loading news...</div>

    return (
        <div className="news-feed">
            {articles.map((article, idx) => (
                <div className="news-card" key={idx}>
                    <img src={article.urlToImage || '/fallback.jpg'} alt="news" />
                    <h2>{article.title}</h2>
                    <p><strong>{article.source.name}</strong> — {new Date(article.publishedAt).toLocaleDateString()}</p>
                </div>
            ))}
        </div>
    )
}

export default NewsFeed
