import React, { useEffect, useState } from 'react';
import { fetchQuizStats } from '../services/statsService';
import { Brain, Award, CheckCircle, BarChart } from 'lucide-react';
import { StatsCard, TopicDistribution, QuizAttemptsTable } from '../components/stats';

const StatsPage = () => {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    avgScore: 0,
    topicDistribution: {},
    totalAttempts: 0,
    totalAttemptsByQuiz: [],
    latestScoreByQuiz: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchQuizStats();
        setStats(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load statistics');
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4 bg-gray-900">
        {error}
      </div>
    );
  }

  // Combine totalAttemptsByQuiz and latestScoreByQuiz
  const quizAttempts = stats.totalAttemptsByQuiz.map(quiz => ({
    ...quiz,
    latestScore: stats.latestScoreByQuiz.find(
      score => score.quizTitle === quiz.quizTitle
    )?.latestScore
  })).sort((a, b) => b.latestScore - a.latestScore);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Quiz Statistics</h1>
            <p className="text-gray-400">Track your quiz performance and progress</p>
          </div>
          <div className="flex space-x-4">
            <select 
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="Total Quizzes" 
            value={stats.totalQuizzes}
            icon={Brain}
            color="text-purple-500"
          />
          <StatsCard 
            title="Total Attempts" 
            value={stats.totalAttempts}
            icon={CheckCircle}
            color="text-green-500"
          />
          <StatsCard 
            title="Average Score" 
            value={`${stats.avgScore}%`}
            icon={Award}
            color="text-yellow-500"
          />
          <StatsCard 
            title="Topics Covered" 
            value={Object.keys(stats.topicDistribution).length}
            icon={BarChart}
            color="text-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Topic Distribution */}
          <TopicDistribution distribution={stats.topicDistribution} />
          
          {/* Recent Performance */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white text-lg font-semibold mb-4">Recent Performance</h3>
            <div className="space-y-4">
              {quizAttempts.slice(0, 7).map((quiz, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white">{quiz.quizTitle}</span>
                    <span className="text-gray-400">{quiz.latestScore ? `${quiz.latestScore}%` : 'No attempts'}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                      className={`h-2 rounded-full transition-all ${
                        !quiz.latestScore ? 'bg-gray-600' :
                        quiz.latestScore >= 80 ? 'bg-green-500' :
                        quiz.latestScore >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: quiz.latestScore ? `${quiz.latestScore}%` : '100%' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quiz Attempts Table */}
        <QuizAttemptsTable attempts={quizAttempts} />
      </div>
    </div>
  );
};

export default StatsPage;