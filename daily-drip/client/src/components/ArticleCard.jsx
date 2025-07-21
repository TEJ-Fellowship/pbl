import ArticleImage from './ArticleImage'
import ArticleContent from './ArticleContent'

const ArticleCard = ({ article, onClick }) => (
    <div
      className="bg-white border rounded-lg shadow-md w-96 mx-auto overflow-hidden cursor-pointer hover:shadow-lg transition"
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