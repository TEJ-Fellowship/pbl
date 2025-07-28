import ArticleImage from './ArticleImage'
import ArticleContent from './ArticleContent'
import { Bookmark, BookmarkCheck } from 'lucide-react'

const ArticleCard = ({ article, onClick, onBookmark, isBookmarked }) => (
  <div
    className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full h-full p-4"
    onClick={() => onClick(article)}
  >

    {/*Bookmark Button*/}
    <button
      className="absolute bottom-3 right-3 bg-gray-800 dark:bg-gray-200 rounded-full p-1 text-gray-200 dark:text-gray-800 hover:bg-gray-700 dark:hover:bg-gray-300 transition"
      onClick={(e) => {
        e.stopPropagation();
        onBookmark(article);
      }}
      title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
    >
      {isBookmarked ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}
    </button>

    <ArticleImage urlToImage={article.urlToImage} title={article.title} />
    <ArticleContent
      title={article.title}
      description={article.description}
      source={article.source}
    />
  </div>
)

export default ArticleCard
