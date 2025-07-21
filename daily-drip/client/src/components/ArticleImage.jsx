const ArticleImage = ({ urlToImage, title }) => (
    <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
      {urlToImage ? (
        <img
          src={urlToImage}
          alt={title || "news"}
          width="300"
          onError={(e) => { e.target.src = '/fallback.jpg' }}
        />
      ) : (
        <div className="w-[300px] h-[200px] bg-gray-200 flex items-center justify-center text-gray-500 italic">
          No image
        </div>
      )}
    </div>
  )

  export default ArticleImage