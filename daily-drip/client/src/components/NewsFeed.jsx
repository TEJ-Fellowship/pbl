import { useEffect, useState } from "react";
import axios from "axios";
import Modal from "./Modal";
import ArticleCard from "./ArticleCard";
import Navbar from "./NavBar";
import categorizeArticle from "../utils/categorizeArticle";
import filterArticles from "../utils/filterArticles";
import Pagination from "./Pagination";

const NewsFeed = ({
  selectedCategory = "",
  onCategorySelect,
  searchKeyword = "",
  onSearch,
}) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(8);

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

    const lastPostIndex = currentPage * postsPerPage;
    const firstPostIndex = lastPostIndex - postsPerPage;
    const currentPosts = filteredArticles.slice(firstPostIndex, lastPostIndex);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <div className="animate-spin text-4xl">📰</div>
        <p className="mt-4 text-gray-600 text-lg">
          Fetching fresh headlines...
        </p>
      </div>
    );
  }

  return (
    <>
      <Navbar onSearch={onSearch} onCategorySelect={onCategorySelect} />
      <div className="news-feed grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 py-8">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full text-center text-gray-600">
            No news found for this category.
          </div>
        ) : (
          currentPosts.map((article, idx) => (
            <ArticleCard
              key={idx}
              article={article}
              onClick={setSelectedArticle}
            />
          ))
        )}
        <Modal
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
          article={selectedArticle}
        />
      </div>
      <Pagination postsPerPage={postsPerPage} totalPosts={filteredArticles.length} setCurrentPage={setCurrentPage} />
    </>
  );
};

export default NewsFeed;
