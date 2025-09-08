const HomePage = () => (
  <div className="mb-12 text-center relative z-20 px-4">
    <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight text-shadow drop-shadow-2xl">
      Capture a single second,
      <br />
      relive a lifetime of memories.
    </h2>
    <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed text-shadow drop-shadow-lg">
      Glimpse is built on one simple idea: the micro video is the default unit of memory. 
      By capturing just one second of your day, every day, you create an emotional highlight reel that is short, bingeable, and deeply personal. 
      Over time, your collection of glimpses becomes the most authentic and memorable way to look back on your life.
    </p>
    
    <button 
      className="px-8 py-4 bg-white text-[--glimpse-dark-blue] font-bold rounded-full shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 active:scale-95 duration-200 focus:outline-none focus:ring-2 focus:ring-[--glimpse-dark-blue] focus:ring-offset-2 focus:ring-offset-gray-50"
    >
      Upload Today's Glimpse
    </button>
  </div>
);

export default HomePage