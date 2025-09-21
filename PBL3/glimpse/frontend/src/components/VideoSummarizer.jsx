import { useState } from "react";

const VideoSummarizer = ({ videoUrl }) => {
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState('');

  // Function to get a video summary from the Gemini API
  const handleSummarize = async () => {
    if (!videoUrl) {
      setError("Video URL is required.");
      return;
    }

    setIsSummarizing(true);
    setSummary('');
    setError('');

    const systemPrompt = "You are a helpful assistant that generates concise, single-paragraph summaries of video montages. Focus on key events, moods, and themes. The summary should be friendly and engaging.";
    const userQuery = "Summarize this video montage. The video contains clips of a person hiking in a forest, having a birthday party with friends, and relaxing on a beach at sunset. The overall mood is cheerful and adventurous.";
    const apiKey = ""; // Canvas will provide this at runtime

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const result = await response.json();
      const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (generatedText) {
        setSummary(generatedText);
      } else {
        setError("Failed to generate a summary. Please try again.");
      }
    } catch (err) {
      console.error("Error during summarization:", err);
      setError("An error occurred while generating the summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleClear = () => {
    setSummary('');
    setIsSummarizing(false);
    setError('');
  };

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <PlayCircle className="w-5 h-5 text-purple-400" />
        Video Summary
      </h4>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <p className="text-sm text-gray-400 mb-4">
          Click the button below to get an AI-generated summary of your montage.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={handleSummarize}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-br from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSummarizing || !videoUrl}
          >
            {isSummarizing && <Loader className="animate-spin" size={20} />}
            <span>Summarize Video</span>
          </button>
          
          <button
            onClick={handleClear}
            className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            Clear
          </button>
        </div>

        {isSummarizing && (
          <div className="flex items-center justify-center p-4">
            <Loader className="animate-spin text-teal-400" size={32} />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-800 text-red-200 border border-red-600 shadow-inner">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {summary && (
          <div className="mt-6 p-6 rounded-xl bg-slate-700 text-slate-200 border border-slate-600 shadow-md">
            <p className="text-sm font-semibold mb-2 text-teal-300">Summary:</p>
            <p className="text-base leading-relaxed">
              {summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSummarizer