import React, { useState } from "react";
import { Loader, FileText } from "lucide-react";

// Gemini summarization logic with FormData
async function summarizeVideoWithGemini(videoUrl) {
  try {
    // Fetch video as blob
    const response = await fetch(videoUrl);
    const blob = await response.blob();

    // Convert blob -> File for FormData
    const file = new File([blob], "uploaded-video.mp4", { type: blob.type });

    // Build FormData
    const formData = new FormData();
    formData.append("video", file);
    formData.append(
      "prompt",
      "Summarize this montage video in 3-4 sentences, focusing on the overall mood, activities, and themes."
    );

    // Call backend (no need for Content-Type, browser sets it with boundary)
    const res = await fetch("http://localhost:3001/api/gemini/summarize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to summarize video");
    return data.summary;
  } catch (err) {
    console.error("Gemini summarization failed:", err);
    throw err;
  }
}

function VideoSummarizer({ videoUrl }) {
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState(null);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setError(null);
    setSummary("");

    try {
      const result = await summarizeVideoWithGemini(videoUrl);
      setSummary(result);
    } catch (err) {
      setError(err.message || "Failed to summarize");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mt-6">
      <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <FileText className="w-5 h-5 text-purple-400" />
        Video Summary
      </h4>
      <p className="text-sm text-gray-400 mb-4">
        Click below to generate an AI-powered summary of your montage.
      </p>

      <button
        onClick={handleSummarize}
        disabled={isSummarizing}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
      >
        {isSummarizing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Summarizing...
          </>
        ) : (
          "✨ Summarize Montage"
        )}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {summary && (
        <div className="mt-4 p-4 bg-white/10 rounded-lg text-gray-200 text-sm leading-relaxed">
          {summary}
        </div>
      )}
    </div>
  );
}

export default VideoSummarizer;
