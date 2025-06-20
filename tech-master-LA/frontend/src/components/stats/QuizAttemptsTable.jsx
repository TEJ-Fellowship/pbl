// Quiz Attempts Table Component
const QuizAttemptsTable = ({ attempts }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-white text-lg font-semibold mb-4">Quiz Performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left py-2 text-gray-400">Quiz Title</th>
              <th className="text-left py-2 text-gray-400">Total Attempts</th>
              <th className="text-left py-2 text-gray-400">Latest Score</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((quiz, index) => (
              <tr key={index} className="border-t border-gray-700">
                <td className="py-3 text-white">{quiz.quizTitle}</td>
                <td className="py-3 text-white">{quiz.attempts}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    quiz.latestScore >= 70 ? 'bg-green-500/20 text-green-400' :
                    quiz.latestScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {quiz.latestScore !== null ? `${quiz.latestScore}%` : 'No attempts'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  export default QuizAttemptsTable;