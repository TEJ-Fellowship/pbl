import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MessageBubble = ({ msg }) => {
  const isUser = msg.sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mr-2 mt-1 h-8 w-8 flex items-center justify-center rounded-full bg-gray-300 text-gray-700 text-sm select-none">🤖</div>
      )}
      <div
        className={`max-w-xl px-4 py-3 rounded-2xl shadow-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-white text-gray-900 rounded-bl-none border border-gray-200"
        }`}
      >
        {isUser ? (
          <span>{msg.text}</span>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:bg-gray-100 prose-code:text-gray-900 prose-a:text-blue-600 hover:prose-a:underline">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
          </div>
        )}
        {msg.sentiment && !isUser && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 border border-gray-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              {msg.sentiment}
            </span>
            {typeof msg.confidence === "number" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 border border-gray-200">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                {msg.confidence}%
              </span>
            )}
          </div>
        )}
        {!isUser && msg.citations?.length > 0 && (
          <div className="mt-2 text-[11px] text-gray-600">
            <div className="font-medium mb-1">Sources:</div>
            <ul className="list-disc pl-4 space-y-0.5">
              {msg.citations.map((c, idx) => (
                <li key={idx}>
                  <span className="font-mono">{c.label}</span> — {c.source} ({c.channel}{c.isPolicy ? ", policy" : ""})
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isUser && msg.disclaimer && (
          <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            This is general guidance. For account‑specific issues or legal advice, please contact PayPal support.
          </div>
        )}
      </div>
      {isUser && (
        <div className="ml-2 mt-1 h-8 w-8 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm select-none">🧑</div>
      )}
    </div>
  );
};

export default MessageBubble;
