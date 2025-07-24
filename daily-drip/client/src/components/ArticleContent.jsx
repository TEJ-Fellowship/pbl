const ArticleContent = ({ title, description, source }) => (
  <div className="px-2 py-3">
    <h3 className="font-semibold text-base mb-1 line-clamp-2">{title}</h3>
    <p className="text-gray-600 text-xs mb-2 line-clamp-2">{description}</p>
    <p className="text-gray-500 text-xs font-medium">
      {source?.name || "Unknown Source"}
    </p>
  </div>
)
export default ArticleContent
