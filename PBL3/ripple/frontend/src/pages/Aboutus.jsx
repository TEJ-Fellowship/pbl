import React from 'react';
import { useNavigate } from 'react-router-dom';

const RippleAbout = () => {
  
  const navigate = useNavigate('path')
  return (
    <div 
      className="min-h-screen p-6 text-white"
      style={{
        backgroundImage:
          "radial-gradient(circle, #043317, #072b15, #092412, #081c0f, #05150a, #071004, #070a01, #030300, #030200, #030100, #020000, #000000)",
      }}
    >
      {/* Hero Section */}
      <section className="relative px-4 md:px-8 py-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-transparent to-green-900/20 blur-3xl"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-green-900/30">
            <span className="text-lg animate-pulse duration-1000 delay-200">✨</span>
            <span className="text-sm text-gray-300">One Tap, Global Social Chain</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-green-300 to-green-500 bg-clip-text text-transparent">
            About Ripple
          </h1>
          
          <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Ripple is revolutionizing social connection through the simplest possible interaction: 
            a single tap that creates waves of synchronized activity across global networks.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="px-6 md:px-10 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-white">Our Mission</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                We believe that meaningful social connection shouldn't require complex interfaces, lengthy posts, or endless scrolling. 
                Ripple strips away the noise and returns to the essence of human connection.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                With just one tap, you can send a ripple that travels through your network, creating spontaneous moments 
                of synchronized activity that bring people together in real-time.
              </p>
            </div>
            <div className="relative">
              <div className="bg-black/40 backdrop-blur-sm border border-green-900/30 rounded-2xl p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-2xl mb-6 mx-auto">
                  <span className="text-3xl"><img src="immediate.png" alt="tap" className='w-12'/></span>
                </div>
                <h3 className="text-xl font-semibold text-center mb-4">Simple. Immediate. Global.</h3>
                <p className="text-gray-400 text-center">
                  No algorithms, no ads, no complexity. Just pure human connection through the power of synchronicity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 md:px-10 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How Ripple Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <img src="tap2.png" alt="tap" className='w-12'/>,
                title: "One Tap",
                description: "Send a ripple with a single tap. No typing, no thinking, just pure intention."
              },
              {
                icon: <img src="users.png" alt="users" className='w-12'/>,
                title: "Network Effect",
                description: "Your ripple spreads through your network, encouraging friends to tap back and keep the wave alive."
              },
              {
                icon: <img src="wave.png" alt="wave" className='w-12'/>,
                title: "Global Waves",
                description: "Create synchronized moments of activity that span across continents and time zones."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-black/40 backdrop-blur-sm border border-green-900/30 rounded-2xl p-8 text-center hover:bg-black/60 transition-all duration-300">
                <div className="flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-2xl mb-6 mx-auto">
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="px-6 md:px-10 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-black/40 backdrop-blur-sm border border-green-900/30 rounded-3xl p-12">
            <span className=" mb-8 flex items-center justify-center"><img src="growth.png" alt="tap" className='w-16' /></span>
            <h2 className="text-3xl font-bold mb-6">The Future of Ripple</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              We're building more than just an app—we're creating a new paradigm for human connection. 
              Ripple represents the future where technology amplifies our natural social rhythms rather than overwhelming them.
            </p>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <h4 className="font-semibold text-green-400">Current Features:</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• One-tap ripple sending</li>
                  <li>• Real-time network waves</li>
                  <li>• Ripple history tracking</li>
                  <li>• Streak counters</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-green-400">Coming Soon:</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• AI-powered ripple insights</li>
                  <li>• Global ripple mapping</li>
                  <li>• Predictive wave forecasting</li>
                  <li>• Enhanced mood detection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="px-6 md:px-10 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Ripple?</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of people already creating waves of connection across the globe. 
            Your next meaningful moment is just one tap away.
          </p>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25" onClick={()=>navigate('/dashboard')}>
            Send Your First Ripple
          </button>
        </div>
      </section>
    </div>
  );  
};

export default RippleAbout;