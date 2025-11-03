const TrendingTopics = () => {
    const topics = ["#Permissions", "#Auto-Mod", "#Welcome-Messages", "#Logging", "#Custom-Commands"];

    return (
      <div className="mt-12 mb-16">
        <p className="text-center text-sm uppercase tracking-[2px] text-gray-400 mb-5 font-medium">Trending Topics</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {topics.map((topic) => (
            <button
              key={topic}
              className="px-5 py-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 hover:border-blue-500/50 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  export default TrendingTopics;
  