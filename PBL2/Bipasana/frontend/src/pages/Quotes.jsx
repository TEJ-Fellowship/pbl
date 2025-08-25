import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function Quotes() {
    const [currentQuotes, setCurrentQuotes] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchQuote = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("https://api.quotable.io/random");
            const data = await response.json();
            const formattedQuote = {
                content: data.content,
                author: data.author
            };
            setCurrentQuotes(formattedQuote);

        } catch (err) {
            console.warn('API Failed', err);
            setCurrentQuotes(null);
            setError('Quotes are not available right now. Please try again later.');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchQuote();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-purple-300 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-800 mb-4 tracking-tight">
                        Daily Quotes
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-pink-400 to-purple-500 mx-auto rounded-full"></div>
                </div>

                {/* Quote Card */}
                <div className="bg-white/40 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-white/30 mb-8">
                    {error && (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4"><img src="/warning.png" alt="Warning" className="w-10 h-10 mb-4" /> </div>
                            <p className="text-red-600 font-medium text-lg">{error}</p>
                        </div>
                    )}

                    {currentQuotes ? (
                        <div className="text-center">
                            <div className="text-6xl text-purple-400 mb-6 opacity-60">"</div>
                            
                            <p className="font-montserrat text-2xl md:text-3xl font-light text-gray-800 leading-relaxed mb-8 italic">
                                "{currentQuotes.content}"
                            </p>
                            
                            <div className="flex items-center justify-center mb-6">
                                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
                            </div>
                            
                            <p className="text-xl text-gray-700 font-semibold">
                                <strong>- {currentQuotes.author}</strong>
                            </p>
                        </div>
                    ) : (
                        !error && (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-400/30 mb-4">
                                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                                </div>
                                <p className="text-purple-700 font-medium">Loading...</p>
                            </div>
                        )
                    )}
                </div>

                {/* Button */}
                <div className="text-center">
                    <button 
                        onClick={fetchQuote}
                        className="bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
                    >
                        Load New Quotes
                    </button>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-purple-600/70 text-sm">
                        Inspiring words to brighten your day ✨
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Quotes;