const ArticleContent = ({ title, description, source }) => (
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-3">{description}</p>
      <p className="text-gray-500 text-xs font-medium">
        {source?.name || "Unknown Source"}
      </p>
    </div>
  )

  export default ArticleContent