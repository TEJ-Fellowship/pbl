// Topic Distribution Component
const TopicDistribution = ({ distribution }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-white text-lg font-semibold mb-4">Topic Distribution</h3>
      <div className="space-y-4">
        {Object.entries(distribution).map(([topic, count]) => (
          <div key={topic}>
            <div className="flex justify-between mb-2">
              <span className="text-white">{topic}</span>
              <span className="text-gray-400">{count} quizzes</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${(count / Object.values(distribution).reduce((a, b) => a + b, 0)) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  export default TopicDistribution;