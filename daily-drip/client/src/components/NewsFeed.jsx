import { useEffect, useState } from "react";
import axios from "axios";
import Modal from "./Modal";
import ArticleCard from "./ArticleCard";
import Navbar from "./NavBar";
import categorizeArticle from "../utils/categorizeArticle";
import filterArticles from "../utils/filterArticles";

const timeAgo = (dateString) => {
  const now = new Date();
  const published = new Date(dateString);
  const diffMs = now - published;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours === 1) return "1 hour ago";
  return `${diffHours} hours ago`;
};

const NewsFeed = ({ selectedCategory = "", onCategorySelect, searchKeyword = "", onSearch }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);

  useEffect(() => {
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    setBookmarks(savedBookmarks);
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get("/api/news");
        const categorized = response.data.articles.map(categorizeArticle);
        setArticles(categorized);
      } catch (error) {
        console.error("Error fetching news:", error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const filteredArticles = filterArticles(articles, selectedCategory, searchKeyword);
  const topArticles = filteredArticles.slice(0, 5);
  const heroArticle = topArticles[0];

  const handleBookmark = (article) => {
    let updatedBookmarks = [...bookmarks];
    const exists = updatedBookmarks.find(item => item.url === article.url);

    if (exists) {
      updatedBookmarks = updatedBookmarks.filter(item => item.url !== article.url);
    } else {
      updatedBookmarks.push(article);
    }

    setBookmarks(updatedBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
  };

  const toggleBookmarks = () => setShowBookmarks(prev => !prev);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <div className="animate-spin text-4xl">📰</div>
        <p className="mt-4 text-gray-600 text-lg">Fetching fresh headlines...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar
        onSearch={onSearch}
        onCategorySelect={onCategorySelect}
        onToggleBookmarks={toggleBookmarks}
        showBookmarks={showBookmarks}
        className="fixed top-0 left-0 right-0 z-30 bg-black bg-opacity-40 backdrop-blur-md"
      />

      {/* Hero Section - only when NOT showing bookmarks */}
      {!showBookmarks && heroArticle && (
        <div
          className="relative min-h-[85vh] pt-20 flex flex-col justify-end bg-cover bg-center text-white"
          style={{
            backgroundImage: `url(${heroArticle.urlToImage || "/fallback.jpg"})`,
          }}
          onClick={() => setSelectedArticle(heroArticle)}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-0" />
          <div className="relative z-10 max-w-4xl px-6 pb-16">
            <div className="mb-3 flex gap-3 items-center text-sm">
              <span className="bg-red-600 px-2 py-0.5 rounded text-xs font-semibold">BREAKING</span>
              <span>{timeAgo(heroArticle.publishedAt)}</span>
              <span className="italic">{heroArticle.source?.name}</span>
            </div>
            <h1 className="text-5xl font-extrabold mb-4 leading-tight">{heroArticle.title}</h1>
            <p className="text-lg max-w-3xl text-gray-300">{heroArticle.description}</p>
            <button className="mt-6 bg-white text-black px-5 py-3 rounded font-semibold shadow hover:bg-gray-200 transition">
              Read Full Story
            </button>
          </div>
        </div>
      )}

      <div className="h-12"></div>

      {/* Header for articles / bookmarks */}
      <div className="flex items-center justify-between px-6 mb-6">
        <h2 className="text-2xl font-bold">
          {showBookmarks ? "Bookmarked Articles" : "Latest Stories"}
        </h2>
        {!showBookmarks && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-blue-600 hover:underline font-medium"
          >
            View All →
          </button>
        )}
      </div>

      {/* Article Grid or Bookmarks */}
      {showBookmarks ? (
        bookmarks.length === 0 ? (
          <p className="text-center text-gray-600 mt-20">No bookmarks saved yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 py-6">
            {bookmarks.map((article, idx) => (
              <ArticleCard
                key={idx}
                article={article}
                onClick={setSelectedArticle}
                onBookmark={handleBookmark}
                isBookmarked={true}
              />
            ))}
          </div>
        )
      ) : (
        <div className="w-full px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(showAll ? filteredArticles.slice(1) : topArticles.slice(1, 5)).map((article, idx) => (
            <ArticleCard
              key={idx}
              article={article}
              onClick={setSelectedArticle}
              onBookmark={handleBookmark}
              isBookmarked={bookmarks.some(bookmark => bookmark.url === article.url)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        article={selectedArticle}
      />
    </>
  );
};

export default NewsFeed;
