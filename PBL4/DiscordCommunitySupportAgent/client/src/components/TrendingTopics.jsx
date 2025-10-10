const TrendingTopics = () => {
    const topics = ["#Permissions", "#Auto-Mod", "#Welcome-Messages", "#Logging", "#Custom-Commands"];
  
    return (
      <div className="flex justify-center space-x-3 mb-12">
        {topics.map(topic => (
          <span key={topic} className="bg-gray-800 px-3 py-1 rounded-full text-sm hover:bg-gray-700 cursor-pointer">
            {topic}
          </span>
        ))}
      </div>
    );
  };
  
  export default TrendingTopics;
  