const ArticleImage = ({ urlToImage, title }) => (
  <div className="h-28 bg-gray-100 flex items-center justify-center overflow-hidden">
    {urlToImage ? (
      <img
        src={urlToImage}
        alt={title || "news"}
        width="220"
        className="object-cover w-full h-full"
        onError={(e) => {
          e.target.src = "/fallback.jpg";
        }}
      />
    ) : (
      <div className="w-[220px] h-[112px] bg-gray-200 flex items-center justify-center text-gray-500 italic">
        No image
      </div>
    )}
  </div>
);
export default ArticleImage;
