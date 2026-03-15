import React from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate()

  const handleNavigation = ()=>{
    navigate(-1)
  }
  return (
      <div className='min-h-screen p-6'
    style={{
        backgroundImage: 'radial-gradient(circle, #043317, #072b15, #092412, #081c0f, #05150a, #071004, #070a01, #030300, #030200, #030100, #020000, #000000)'
    }}>
      <button className='w-12 hover:bg-green-900 rounded-xl ' onClick={handleNavigation}><img src="/backs.png" alt="back" /></button>
      <div className="max-w-6xl mx-auto">

        {/* Profile Section */}
        <div className="bg-green-900/30 border border-green-500/20 rounded-2xl p-8 mb-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                JD
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white mb-1">john@ripple.com</h2>
                <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Active Rippler</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors">
                Edit
              </button>
              <button className="px-6 py-2 bg-slate-700/50 text-white rounded-lg font-medium border border-slate-600/50 hover:bg-slate-700 transition-colors">
                Share
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-1">1,247</div>
              <div className="text-slate-400 text-sm">Total Ripples</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-1">42</div>
              <div className="text-slate-400 text-sm">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-1">156</div>
              <div className="text-slate-400 text-sm">Ripple Back</div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-8">
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
                      <div className="text-white font-medium">"Feeling grateful for small moments today ✨"</div>
                      <div className="text-slate-400 text-sm">Started a wave of 14 ripples • 3 hr ago</div>
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
                      <div className="text-white font-medium">"Monday motivation incoming! 🚀"</div>
                      <div className="text-slate-400 text-sm">Started a wave of 27 ripples • 1 day ago</div>
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
                      <div className="text-white font-medium">"Just finished a great workout! 💪"</div>
                      <div className="text-slate-400 text-sm">Started a wave of 12 ripples • 2 days ago</div>
                    </div>
                  </div>
                  <span className="text-green-400 font-bold">+12</span>
                </div>
              </div>
            </div>

            {/* Ripple Patterns */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Ripple Patterns</h3>
                <span className="text-slate-400 text-sm">AI Insights</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-orange-900/30 border border-orange-500/20 rounded-lg">
                  <div className="text-2xl mb-2">🌅</div>
                  <div className="text-white font-medium mb-1">Morning Rippler</div>
                  <div className="text-slate-400 text-sm">Peak activity 6-9 AM</div>
                </div>

                <div className="p-4 bg-yellow-900/30 border border-yellow-500/20 rounded-lg">
                  <div className="text-2xl mb-2">✨</div>
                  <div className="text-white font-medium mb-1">Positive Vibes</div>
                  <div className="text-slate-400 text-sm">89% uplifting content</div>
                </div>

                <div className="p-4 bg-orange-900/30 border border-orange-500/20 rounded-lg">
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="text-white font-medium mb-1">Streak Master</div>
                  <div className="text-slate-400 text-sm">42-day active streak</div>
                </div>

                <div className="p-4 bg-blue-900/30 border border-blue-500/20 rounded-lg">
                  <div className="text-2xl mb-2">🌊</div>
                  <div className="text-white font-medium mb-1">Wave Starter</div>
                  <div className="text-slate-400 text-sm">Avg 28 ripples per wave</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Ripple Badges */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-6">Ripple Badges</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-purple-900/30 border border-purple-500/20 rounded-lg">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ♾️
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Infinite Loop</div>
                    <div className="text-slate-400 text-xs">50+ Tap backs</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-900/30 border border-yellow-500/20 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    SL
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Storm Bringer</div>
                    <div className="text-slate-400 text-xs">100 Days Streak</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-900/30 border border-blue-500/20 rounded-lg">
                  <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    🌙
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm"> Moonlit Ripple </div>
                    <div className="text-slate-400 text-xs">Night Streak</div>
                  </div>
                </div>
              </div>
            </div>

            {/* This Week */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-6">This Week</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Ripples Sent</span>
                  <span className="text-green-400 font-bold">47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Waves Started</span>
                  <span className="text-green-400 font-bold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Ripples Received</span>
                  <span className="text-green-400 font-bold">89</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Best Wave Size</span>
                  <span className="text-green-400 font-bold">45</span>
                </div>
              </div>
            </div>

            {/* Mood Insights */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-6">Mood Insights</h3>
              
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
                    <div className="bg-green-400 h-2 rounded-full" style={{width: '83%'}}></div>
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
                    <div className="bg-yellow-400 h-2 rounded-full" style={{width: '62%'}}></div>
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
                    <div className="bg-purple-400 h-2 rounded-full" style={{width: '75%'}}></div>
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