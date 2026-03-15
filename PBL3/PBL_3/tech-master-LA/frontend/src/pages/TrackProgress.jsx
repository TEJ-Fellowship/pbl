import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  Brain,
  BarChart3,
  Target,
  Calendar,
  BrainCircuit,
} from "lucide-react";
import axios from "axios";
import config from "../config/config";
import { toast } from "react-toastify";

const TrackProgress = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create axios instance with credentials
  const api = axios.create({
    baseURL: config.API_BASE_URL || "http://localhost:5000",
    withCredentials: true,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/api/stats");

      if (response.data && response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error("Failed to fetch statistics");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError("Failed to load statistics. Please try again.");
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 bg-black">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 bg-black">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Track Progress
            </h1>
            <p className="text-gray-400">
              Monitor your learning journey and performance
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <BarChart3 size={20} />
            Refresh Stats
          </button>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <BrainCircuit className="text-red-500" size={24} />
              <span className="text-green-400 text-sm">Active</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.totalQuizzes || 0}
            </div>
            <div className="text-gray-400 text-sm">Total Quizzes</div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Target className="text-blue-500" size={24} />
              <span className="text-green-400 text-sm">Average</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.avgScore || 0}%
            </div>
            <div className="text-gray-400 text-sm">Average Score</div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="text-green-500" size={24} />
              <span className="text-green-400 text-sm">Completed</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.totalAttempts || 0}
            </div>
            <div className="text-gray-400 text-sm">Quiz Attempts</div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-purple-500" size={24} />
              <span className="text-green-400 text-sm">Recent</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.recentQuizzes || 0}
            </div>
            <div className="text-gray-400 text-sm">Recent Quizzes</div>
          </div>
        </div>

        {/* Performance Trends */}
        {stats?.performanceTrends && stats.performanceTrends.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
            <h3 className="text-white text-xl font-semibold mb-6">
              Performance Trends
            </h3>
            <div className="space-y-4">
              {stats.performanceTrends.slice(0, 5).map((quiz, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-900 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{quiz.quizTitle}</h4>
                    <p className="text-gray-400 text-sm">{quiz.topic}</p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-white font-semibold">
                        {quiz.attempts}
                      </div>
                      <div className="text-gray-400 text-xs">Attempts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-500 font-semibold">
                        {quiz.bestScore}%
                      </div>
                      <div className="text-gray-400 text-xs">Best Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-500 font-semibold">
                        {quiz.averageScore}%
                      </div>
                      <div className="text-gray-400 text-xs">Average</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Distribution */}
        {stats?.topicDistribution &&
          Object.keys(stats.topicDistribution).length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
              <h3 className="text-white text-xl font-semibold mb-6">
                Topic Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.topicDistribution).map(
                  ([topic, count]) => (
                    <div key={topic} className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{topic}</span>
                        <span className="text-red-500 font-bold">{count}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / stats.totalQuizzes) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {/* Latest Scores */}
        {stats?.latestScoreByQuiz && stats.latestScoreByQuiz.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white text-xl font-semibold mb-6">
              Latest Quiz Scores
            </h3>
            <div className="space-y-4">
              {stats.latestScoreByQuiz.slice(0, 5).map((quiz, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Award className="text-yellow-500" size={20} />
                    <div>
                      <h4 className="text-white font-medium">
                        {quiz.quizTitle}
                      </h4>
                      <p className="text-gray-400 text-sm">Latest attempt</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        quiz.latestScore >= 80
                          ? "text-green-500"
                          : quiz.latestScore >= 60
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                    >
                      {quiz.latestScore || 0}%
                    </div>
                    <div className="text-gray-400 text-sm">Score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!stats ||
          (stats.totalQuizzes === 0 &&
            stats.totalAttempts === 0 &&
            (!stats.performanceTrends ||
              stats.performanceTrends.length === 0))) && (
          <div className="text-center py-12">
            <TrendingUp className="text-gray-500 mx-auto mb-4" size={48} />
            <h3 className="text-white text-xl font-semibold mb-2">
              No Data Available
            </h3>
            <p className="text-gray-400 mb-6">
              Start taking quizzes to see your progress statistics here.
            </p>
            <button
              onClick={() => (window.location.href = "/smart-quizzes")}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
            >
              Take Your First Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackProgress;
