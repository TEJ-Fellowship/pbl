import React from "react";
import { ExternalLink, Copy, Star } from "lucide-react";

const SourceCitations = ({ sources }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatScore = (score) => {
    return (score * 100).toFixed(1);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sources</h3>
        <span className="text-sm text-gray-500">{sources.length} sources</span>
      </div>

      {sources.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Star className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No sources available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source, index) => (
            <div key={index} className="source-card">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                  {source.title || `Source ${index + 1}`}
                </h4>
                <div className="flex items-center space-x-1 ml-2">
                  <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                    {formatScore(source.score)}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-3 line-clamp-3">
                {source.chunk}
              </p>

              <div className="flex items-center justify-between">
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View source
                  </a>
                )}
                <button
                  onClick={() => copyToClipboard(source.chunk)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SourceCitations;
