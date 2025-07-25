import ArticleImage from './ArticleImage'
import ArticleContent from './ArticleContent'

const ArticleCard = ({ article, onClick }) => (
  <div
    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full h-full p-4"
    onClick={() => onClick(article)}
  >
    <ArticleImage urlToImage={article.urlToImage} title={article.title} />
    <ArticleContent
      title={article.title}
      description={article.description}
      source={article.source}
    />
  </div>
)

export default ArticleCard
