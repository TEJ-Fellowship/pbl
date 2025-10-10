const Hero = () => {
    return (
      <section className="text-center py-20 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Your AI-Powered Community Assistant
        </h1>
        <p className="text-gray-400 mb-6">
          Automate moderation, answer questions, and manage your Discord server with ease. 
          Need help? Search our knowledge base below.
        </p>
        <div className="flex justify-center mb-6">
          <input 
            type="text" 
            placeholder="Search for help articles..." 
            className="rounded-l px-4 py-2 w-64 bg-gray-800 border border-gray-700 focus:outline-none"
          />
          <button className="bg-blue-600 px-4 py-2 rounded-r hover:bg-blue-500">Search</button>
        </div>
      </section>
    );
  };
  
  export default Hero;
  