import { MdLogin } from "react-icons/md";
import { Search, ChevronDown, ChevronRight, Code, FileText, Zap, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";

const Hero = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [aiAnswer, setAiAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [serverContext, setServerContext] = useState({
    type: 'general',
    size: 'unknown',
    purpose: 'community'
  });
  const [feedbackState, setFeedbackState] = useState(null); // 'positive' | 'negative'

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setAiAnswer("");
    setResults([]);
    
    try {
      const response = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query, 
          sessionId: 'user123',
          serverContext: serverContext,
          useHybridSearch: true
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAiAnswer(data.answer); // AI-generated answer
        setResults(data.results || []); // Source documents
        setFeedbackState(null);
      } else {
        setAiAnswer("Sorry, I couldn't find relevant information for your query.");
        setResults([]);
        setFeedbackState(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      setAiAnswer("Sorry, there was an error processing your request. Please try again.");
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

  const toggleSourceExpansion = (index) => {
    setExpandedSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 py-0.5 rounded text-blue-300">$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-300">$1</blockquote>')
      .replace(/^• (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/\n/g, '<br>');
  };

  const sendFeedback = async (type) => {
    if (!aiAnswer || feedbackState) return;
    // Optimistic highlight
    setFeedbackState(type);
    try {
      await fetch('http://localhost:3001/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'user123',
          query,
          responseId: 'hero-answer',
          feedbackType: type
        })
      });
    } catch (e) {
      console.error('Feedback error:', e);
      setFeedbackState(null);
    }
  };

  return (
    <section className="relative px-4 pt-20 pb-10 md:pt-28 md:pb-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 md:mb-6 bg-gradient-to-r from-white via-blue-400 to-pink-400 bg-clip-text text-transparent">
          Your AI-Powered Community Assistant
        </h1>
        <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6 md:mb-8 max-w-2xl mx-auto">
          Automate moderation, answer questions, and manage your Discord server with ease. 
          Need help? Search our knowledge base below.
        </p>

        <div className="mx-auto max-w-2xl">
          <div className="flex items-stretch rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-lg shadow-blue-900/20">
            <div className="px-3 hidden sm:flex items-center text-gray-400"><Search size={16} /></div>
            <input
              type="text"
              placeholder="Search for help articles..."
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-gray-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-blue-600 px-4 md:px-6 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* AI Generated Answer */}
        {aiAnswer && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl p-6 mb-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold text-blue-300">AI Answer</h3>
              </div>
              <div 
                className="text-gray-200 leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(aiAnswer) }}
              />
              {/* Feedback controls */}
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <span>Was this helpful?</span>
                <button
                  onClick={() => sendFeedback('positive')}
                  disabled={!!feedbackState}
                  className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${feedbackState === 'positive' ? 'border-green-500 text-green-400 font-semibold' : 'border-gray-600 hover:bg-gray-700'}`}
                >
                  <ThumbsUp size={14} />
                  <span>Yes</span>
                </button>
                <button
                  onClick={() => sendFeedback('negative')}
                  disabled={!!feedbackState}
                  className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${feedbackState === 'negative' ? 'border-red-500 text-red-400 font-semibold' : 'border-gray-600 hover:bg-gray-700'}`}
                >
                  <ThumbsDown size={14} />
                  <span>No</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Source Documents with Accordions */}
        {results.length > 0 && (
          <div className="mt-4 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-300 flex items-center gap-2">
              <FileText size={20} />
              Sources Used ({results.length})
            </h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                  {/* Source Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => toggleSourceExpansion(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedSources[index] ? 
                          <ChevronDown size={16} className="text-gray-400" /> : 
                          <ChevronRight size={16} className="text-gray-400" />
                        }
                        <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded">
                          {result.source}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Zap size={12} />
                            {(result.combinedScore * 100).toFixed(1)}%
                          </span>
                          {result.semanticScore > 0 && (
                            <span className="flex items-center gap-1">
                              <Code size={12} />
                              Semantic: {(result.semanticScore * 100).toFixed(1)}%
                            </span>
                          )}
                          {result.keywordScore > 0 && (
                            <span className="flex items-center gap-1">
                              <Search size={12} />
                              Keyword: {(result.keywordScore * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expandable Content */}
                  {expandedSources[index] && (
                    <div className="px-4 pb-4 border-t border-gray-700">
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Content Preview:</h4>
                        <div className="bg-gray-900/50 rounded p-3">
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {result.content.substring(0, 300)}
                            {result.content.length > 300 && '...'}
                          </p>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Chunk {result.metadata?.chunkIndex || 'N/A'} • 
                          File: {result.metadata?.fileName || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

          <div className="mt-8 flex items-center justify-center gap-4">
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-500 px-6 py-3.5 text-base font-semibold text-white hover:shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-1 transition-all">
              <MdLogin size={18} />
              <span>Login with Discord</span>
            </button>
            <button className="inline-flex items-center rounded-xl border-2 border-white/20 bg-transparent px-6 py-3.5 text-base font-semibold text-white hover:bg-white/5 hover:border-white/40 hover:-translate-y-1 transition-all">Learn More</button>
          </div>
        </div>
      </section>
    );
  };
  
  export default Hero;
  