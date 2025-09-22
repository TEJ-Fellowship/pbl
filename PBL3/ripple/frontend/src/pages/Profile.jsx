import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({
    streak: { current: 0, longest: 0 },
    rippleStats: { sent: 0, received: 0, wavesStarted: 0, totalRipplebacks: 0 }
  });
  const [ripples, setRipples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' or 'ripples'

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic user info (this won't break notifications)
      const userRes = await fetch("http://localhost:5000/api/auth/me", {
        credentials: "include",
      });
      const userData = await userRes.json();
      
      if (userRes.ok) {
        setUser(userData.user.username);
      }

      // Fetch detailed profile stats
      const statsRes = await fetch("http://localhost:5000/api/auth/profile-stats", {
        credentials: "include",
      });
      const statsData = await statsRes.json();
      
      console.log("Stats data:", statsData);
      
      if (statsRes.ok) {
        setUserStats({
          streak: statsData.user.streak || { current: 0, longest: 0 },
          rippleStats: statsData.user.rippleStats || { 
            sent: 0, 
            received: 0, 
            wavesStarted: 0, 
            totalRipplebacks: 0 
          }
        });
      }

      // Fetch user's ripples (you'll need to create this endpoint)
      await fetchUserRipples();
      
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRipples = async () => {
    try {
      // Fetch friends ripples (you might want to create a separate endpoint for user's own ripples)
      const ripplesRes = await fetch("http://localhost:5000/api/ripple/friends", {
        credentials: "include",
      });
      const ripplesData = await ripplesRes.json();
      
      if (ripplesRes.ok) {
        setRipples(ripplesData.slice(0, 5)); // Show only first 5 ripples
      }
    } catch (err) {
      console.error("Error fetching ripples:", err);
    }
  };

  const handleRippleBack = async (rippleId, type = "friends") => {
    try {
      const response = await fetch("http://localhost:5000/api/ripple/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          rippleId,
          type
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log("Ripple back successful:", data);
        // Refresh the data to show updated stats
        await fetchUserData();
        alert("Ripple back sent successfully!");
      } else {
        console.error("Error:", data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error occurred");
    }
  };

  const createTestRipple = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/ripple/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          visibility: ["friends", "global"]
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log("Ripple created:", data);
        // Refresh the data to show updated stats
        await fetchUserData();
        alert("Ripple created successfully!");
      } else {
        console.error("Error:", data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error occurred");
    }
  };

  const handleNavigation = () => {
    navigate(-1);
  };

  const refreshStats = async () => {
    await fetchUserData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{
             backgroundImage: "radial-gradient(circle, #043317, #072b15, #092412, #081c0f, #05150a, #071004, #070a01, #030300, #030200, #030100, #020000, #000000)",
           }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundImage:
          "radial-gradient(circle, #043317, #072b15, #092412, #081c0f, #05150a, #071004, #070a01, #030300, #030200, #030100, #020000, #000000)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <button
          className="w-12 hover:bg-green-900 rounded-xl "
          onClick={handleNavigation}
        >
          <img src="/backs.png" alt="back" />
        </button>
        
        {/* Test Buttons */}
        <div className="flex gap-2">
          <button
            onClick={refreshStats}
            className="px-4 py-2 bg-green-800 text-green-200 font-bold rounded-lg text-sm hover:bg-green-900 transition-colors"
          >
            Refresh Stats 🗘
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Profile Section */}
        <div className="bg-green-900/30 border border-green-500/20 rounded-2xl p-8 mb-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-green-400/40 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {user ? user[0].toUpperCase() : ''}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white mb-1">
                  {user}
                </h2>
                <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Active Rippler</span>
                </div>
              </div>
            </div>

          </div>

          {/* Stats - Now using real data */}
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-1">
                {userStats.rippleStats.sent.toLocaleString()}
              </div>
              <div className="text-slate-400 text-sm">Total Ripples</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-1">
                {userStats.streak.current}
              </div>
              <div className="text-slate-400 text-sm">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-1">
                {userStats.rippleStats.totalRipplebacks}
              </div>
              <div className="text-slate-400 text-sm">Ripple Back</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-green-500 text-white'
                : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Stats & Insights
          </button>
          <button
            onClick={() => setActiveTab('ripples')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'ripples'
                ? 'bg-green-500 text-white'
                : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Test Ripples
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-8">
            {activeTab === 'stats' ? (
              <>
                {/* Recent Ripples */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Recent Ripples
                    </h3>
                    <span className="text-slate-400 text-sm">Last 7 days</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                          ✨
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            "Feeling grateful for small moments today ✨"
                          </div>
                          <div className="text-slate-400 text-sm">
                            Started a wave of 14 ripples • 3 hr ago
                          </div>
                        </div>
                      </div>
                      <span className="text-green-400 font-bold">+23</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-medium">
                          🚀
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            "Monday motivation incoming! 🚀"
                          </div>
                          <div className="text-slate-400 text-sm">
                            Started a wave of 27 ripples • 1 day ago
                          </div>
                        </div>
                      </div>
                      <span className="text-green-400 font-bold">+45</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-medium">
                          💪
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            "Just finished a great workout! 💪"
                          </div>
                          <div className="text-slate-400 text-sm">
                            Started a wave of 12 ripples • 2 days ago
                          </div>
                        </div>
                      </div>
                      <span className="text-green-400 font-bold">+12</span>
                    </div>
                  </div>
                </div>

                {/* Ripple Patterns */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      Ripple Patterns
                    </h3>
                    <span className="text-slate-400 text-sm">AI Insights</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-900/30 border border-orange-500/20 rounded-lg">
                      <div className="text-2xl mb-2">🌅</div>
                      <div className="text-white font-medium mb-1">
                        Morning Rippler
                      </div>
                      <div className="text-slate-400 text-sm">
                        Peak activity 6-9 AM
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-900/30 border border-yellow-500/20 rounded-lg">
                      <div className="text-2xl mb-2">✨</div>
                      <div className="text-white font-medium mb-1">
                        Positive Vibes
                      </div>
                      <div className="text-slate-400 text-sm">
                        89% uplifting content
                      </div>
                    </div>

                    <div className="p-4 bg-orange-900/30 border border-orange-500/20 rounded-lg">
                      <div className="text-2xl mb-2">🔥</div>
                      <div className="text-white font-medium mb-1">
                        Streak Master
                      </div>
                      <div className="text-slate-400 text-sm">
                        {userStats.streak.current}-day active streak
                      </div>
                    </div>

                    <div className="p-4 bg-blue-900/30 border border-blue-500/20 rounded-lg">
                      <div className="text-2xl mb-2">🌊</div>
                      <div className="text-white font-medium mb-1">
                        Wave Starter
                      </div>
                      <div className="text-slate-400 text-sm">
                        {userStats.rippleStats.wavesStarted} waves started
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Test Ripples Tab */
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Test Ripple Interactions
                  </h3>
                  <span className="text-slate-400 text-sm">Test your stats</span>
                </div>

                <div className="space-y-4">
                  {ripples.length > 0 ? (
                    ripples.map((ripple, index) => (
                      <div key={ripple.rippleId || index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {ripple.message || "Test ripple message"}
                            </div>
                            <div className="text-slate-400 text-sm">
                              Ripple ID: {ripple.rippleId} • Responses: {ripple.responses?.length || 0}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRippleBack(ripple.rippleId)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                        >
                          Ripple Back
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-8">
                      <p>No ripples found. Create a ripple to test the functionality!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Ripple Badges */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-6">
                Ripple Badges
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-purple-900/30 border border-purple-500/20 rounded-lg">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ♾️
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">
                      Infinite Loop
                    </div>
                    <div className="text-slate-400 text-xs">50+ Tap backs</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-900/30 border border-yellow-500/20 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    SL
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">
                      Streak Leader
                    </div>
                    <div className="text-slate-400 text-xs">
                      {userStats.streak.longest} Days Longest
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-900/30 border border-blue-500/20 rounded-lg">
                  <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    🌙
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">
                      Moonlit Ripple
                    </div>
                    <div className="text-slate-400 text-xs">Night Streak</div>
                  </div>
                </div>
              </div>
            </div>

            {/* All Time Stats */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-6">
                All Time Stats
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Ripples Sent</span>
                  <span className="text-green-400 font-bold">
                    {userStats.rippleStats.sent}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Waves Started</span>
                  <span className="text-green-400 font-bold">
                    {userStats.rippleStats.wavesStarted}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Ripples Received</span>
                  <span className="text-green-400 font-bold">
                    {userStats.rippleStats.received}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Ripple Backs</span>
                  <span className="text-green-400 font-bold">
                    {userStats.rippleStats.totalRipplebacks}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Current Streak</span>
                  <span className="text-green-400 font-bold">
                    {userStats.streak.current}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Longest Streak</span>
                  <span className="text-green-400 font-bold">
                    {userStats.streak.longest}
                  </span>
                </div>
              </div>
            </div>

            {/* Mood Insights */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-6">
                Mood Insights
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-slate-300 text-sm">Positive</span>
                    </div>
                    <span className="text-white text-sm">83%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-400 h-2 rounded-full"
                      style={{ width: "83%" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span className="text-slate-300 text-sm">Thoughtful</span>
                    </div>
                    <span className="text-white text-sm">62%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: "62%" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <span className="text-slate-300 text-sm">Motivated</span>
                    </div>
                    <span className="text-white text-sm">75%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-purple-400 h-2 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;