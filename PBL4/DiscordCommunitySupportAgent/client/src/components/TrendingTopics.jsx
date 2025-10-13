const TrendingTopics = () => {
    const topics = ["#Permissions", "#Auto-Mod", "#Welcome-Messages", "#Logging", "#Custom-Commands"];

    return (
      <div className="mt-6 mb-10">
        <p className="text-center text-xs tracking-widest text-gray-500 mb-3">TRENDING TOPICS</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700 cursor-pointer"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    );
  };
  
  export default TrendingTopics;
  