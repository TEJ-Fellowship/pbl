import React, { useState, useEffect } from "react";
import {
  Trophy,
  Star,
  Users,
  Heart,
  TrendingUp,
  Award,
  Medal,
  Crown,
  Target,
  Calendar,
  ThumbsUp,
} from "lucide-react";
import { getLeaderboardData, getLeaderboardStats } from "../api/leaderboard";

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalKarma: 0,
    totalLikes: 0,
    totalCompletedTasks: 0,
    avgKarma: 0,
  });
  const [sortBy, setSortBy] = useState("karma");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const [leaderboardResponse, statsResponse] = await Promise.all([
        getLeaderboardData(),
        getLeaderboardStats(),
      ]);
      
      setLeaderboardData(leaderboardResponse);
      setStats(statsResponse);
    } catch (err) {
      console.error("Error fetching leaderboard data:", err);
      setError("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-500 dark:text-yellow-400" size={24} />;
      case 2:
        return <Medal className="text-gray-400 dark:text-gray-300" size={24} />;
      case 3:
        return <Award className="text-amber-600 dark:text-amber-400" size={24} />;
      default:
        return <span className="text-lg font-bold text-gray-600 dark:text-gray-300">#{rank}</span>;
    }
  };

  const getBadgeColor = (badge) => {
    const badgeColors = {
      "bronze": "bg-amber-600 dark:bg-amber-700 text-white",
      "silver": "bg-gray-500 dark:bg-gray-600 text-white",
      "gold": "bg-yellow-500 dark:bg-yellow-600 text-white",
      "platinum": "bg-cyan-500 dark:bg-cyan-600 text-white",
      "diamond": "bg-purple-500 dark:bg-purple-600 text-white",
      "master": "bg-red-500 dark:bg-red-600 text-white",
    };
    return badgeColors[badge] || "bg-gray-500 dark:bg-gray-600 text-white";
  };

//   const getRoleColor = (role) => {
//     switch (role) {
//       case "helper":
//         return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700";
//       case "requester":
//         return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700";
//       default:
//         return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
//     }
//   };

  const sortedData = [...leaderboardData].sort((a, b) => {
    switch (sortBy) {
      case "karma":
        return b.karmaPoints - a.karmaPoints;
      case "tasksCompleted":
        return b.totalTasksCompleted - a.totalTasksCompleted;
      case "likes":
        return b.totalLikes - a.totalLikes;
      case "rank":
        return a.rank - b.rank;
      default:
        return a.rank - b.rank;
    }
  });

  const Header = () => (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 w-12 h-12 rounded-full flex items-center justify-center">
          <Trophy className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-dark dark:text-text-spotlight">Community Leaderboard</h1>
          <p className="text-text-light dark:text-text-spotlight/70">Celebrating our most active neighbors</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="text-yellow-600 dark:text-yellow-400" size={20} />
            <span className="font-semibold text-text-dark dark:text-text-spotlight">Total Members</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.totalMembers}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="text-green-600 dark:text-green-400" size={20} />
            <span className="font-semibold text-text-dark dark:text-text-spotlight">Total Karma</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalKarma}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-blue-600 dark:text-blue-400" size={20} />
            <span className="font-semibold text-text-dark dark:text-text-spotlight">Tasks Completed</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCompletedTasks}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="text-purple-600 dark:text-purple-400" size={20} />
            <span className="font-semibold text-text-dark dark:text-text-spotlight">Total Likes</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalLikes}</p>
        </div>
      </div>
    </div>
  );

  const SortFilter = () => (
    <div className="bg-background dark:bg-background-politeDark rounded-2xl shadow-lg p-6 mb-6 border border-border dark:border-border-dark">
      <div className="w-full">
        <label className="block text-sm font-medium text-text-dark dark:text-text-spotlight mb-2">
          Sort by
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-4 py-3 border border-border dark:border-border-dark bg-background dark:bg-background-politeDark text-text-dark dark:text-text-spotlight rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
        >
          <option value="karma">Karma Points</option>
          <option value="tasksCompleted">Tasks Completed</option>
          <option value="likes">Total Likes</option>
          <option value="rank">Rank</option>
        </select>
      </div>
    </div>
  );

  const LoadingState = () => (
    <div className="bg-background dark:bg-background-politeDark rounded-2xl shadow-lg p-8 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-text-dark dark:text-text-spotlight">Loading leaderboard data...</p>
    </div>
  );

  const ErrorState = () => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
      <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
      <button
        onClick={fetchLeaderboardData}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  const LeaderboardTable = () => (
    <div className="bg-background dark:bg-background-politeDark rounded-2xl shadow-lg overflow-hidden border border-border dark:border-border-dark">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-dark dark:text-text-spotlight">Rank</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-dark dark:text-text-spotlight">Member</th>
              {/* <th className="px-6 py-4 text-left text-sm font-semibold text-text-dark dark:text-text-spotlight">Role</th> */}
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-dark dark:text-text-spotlight">Karma</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-dark dark:text-text-spotlight">Tasks</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-dark dark:text-text-spotlight">Likes</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-dark dark:text-text-spotlight">Badge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border-dark">
            {sortedData.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-background-humbleDark transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getRankIcon(user.rank)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-400 dark:from-orange-500 dark:to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark dark:text-text-spotlight">{user.name}</p>
                      <p className="text-sm text-text-light dark:text-text-spotlight/70">Member #{user.rank}</p>
                    </div>
                  </div>
                </td>
                {/* <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td> */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-500 dark:text-yellow-400" size={16} />
                    <span className="font-semibold text-text-dark dark:text-text-spotlight">{user.karmaPoints}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="font-medium text-text-dark dark:text-text-spotlight">{user.totalTasksCompleted} completed</p>
                    <p className="text-text-light dark:text-text-spotlight/70">
                      {user.completedTasksCount} posted, {user.helpedTasksCount} helped
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="text-purple-500 dark:text-purple-400" size={16} />
                    <span className="font-semibold text-text-dark dark:text-text-spotlight">{user.totalLikes}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(user.badges)}`}>
                    {user.badges.charAt(0).toUpperCase() + user.badges.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Header />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Header />
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="max-w-6xl bg-background dark:bg-background-humbleDark mx-auto px-4 py-8">
      <Header />
      <SortFilter />
      <LeaderboardTable />
    </div>
  );
};

export default Leaderboard;