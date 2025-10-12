import { MdLogin } from "react-icons/md";
import { Search } from "lucide-react";
import { useState } from "react";

const Hero = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit: 3 }),
      });
      
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative px-4 pt-14 pb-10 md:pt-24 md:pb-14">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 md:mb-6">
          Your AI-Powered Community
          <span className="block">Assistant</span>
        </h1>
        <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
          Automate moderation, answer questions, and manage your Discord server with ease. 
          Need help? Search our knowledge base below.
        </p>

        <div className="mx-auto max-w-2xl">
          <div className="flex items-stretch rounded-lg border border-gray-700 bg-gray-800 overflow-hidden">
            <div className="px-3 hidden sm:flex items-center text-gray-400"><Search size={16} /></div>
            <input
              type="text"
              placeholder="Search for help articles..."
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-gray-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-blue-600 px-4 md:px-5 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="mt-8 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Search Results:</h3>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      {result.source}
                    </span>
                    <span className="text-xs text-gray-400">
                      Score: {result.combinedScore?.toFixed(3) || result.score}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {result.content.substring(0, 200)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
              <MdLogin />
              <span>Login with Discord</span>
            </button>
            <button className="inline-flex items-center rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Learn More</button>
          </div>
        </div>
      </section>
    );
  };
  
  export default Hero;
  