import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Copy,
  Check,
  ExternalLink,
  Clock,
  Code,
  AlertTriangle,
  Info,
} from "lucide-react";
import CodeEditor from "./CodeEditor";

const ResponseFormatter = ({ content, sources = [], metadata = {} }) => {
  const [copiedCode, setCopiedCode] = useState({});

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedCode((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Extract code blocks from markdown content
  const extractCodeBlocks = (content) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    let lastIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [fullMatch, language, code] = match;
      blocks.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
        language: null,
        code: null,
      });
      blocks.push({
        type: "code",
        content: "",
        language: language || "javascript",
        code: code.trim(),
      });
      lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      blocks.push({
        type: "text",
        content: content.slice(lastIndex),
        language: null,
        code: null,
      });
    }

    return blocks.length > 0
      ? blocks
      : [{ type: "text", content, language: null, code: null }];
  };

  const formatResponseTime = (time) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const renderMetadata = () => {
    if (!metadata || Object.keys(metadata).length === 0) return null;

    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Response Details
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
          {metadata.api && (
            <div className="flex items-center space-x-1">
              <Code className="w-3 h-3" />
              <span>API: {metadata.api.toUpperCase()}</span>
            </div>
          )}
          {metadata.language && (
            <div className="flex items-center space-x-1">
              <Code className="w-3 h-3" />
              <span>Language: {metadata.language}</span>
            </div>
          )}
          {metadata.responseTime && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Time: {formatResponseTime(metadata.responseTime)}</span>
            </div>
          )}
          {metadata.chunkCount && (
            <div className="flex items-center space-x-1">
              <span>Sources: {metadata.chunkCount}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSources = () => {
    if (!sources || sources.length === 0) return null;

    return (
      <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center space-x-2 mb-3">
          <ExternalLink className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-900">Sources</span>
        </div>
        <div className="space-y-2">
          {sources.slice(0, 3).map((source, index) => (
            <div
              key={index}
              className="text-xs text-slate-600 bg-white p-2 rounded border"
            >
              <div className="font-medium text-slate-800 mb-1">
                Source {index + 1}
                {source.similarity && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                    {(source.similarity * 100).toFixed(1)}% match
                  </span>
                )}
              </div>
              <div className="line-clamp-2">
                {source.content?.substring(0, 200)}
                {source.content?.length > 200 && "..."}
              </div>
              {source.metadata && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {source.metadata.api && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                      {source.metadata.api}
                    </span>
                  )}
                  {source.metadata.language && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                      {source.metadata.language}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const blocks = extractCodeBlocks(content);

    return blocks.map((block, index) => {
      if (block.type === "code") {
        const codeId = `code-${index}`;
        return (
          <div key={index} className="my-4">
            <div className="flex items-center justify-between bg-slate-800 text-slate-200 px-4 py-2 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {block.language || "Code"}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(block.code, codeId)}
                className="flex items-center space-x-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
              >
                {copiedCode[codeId] ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-900 rounded-b-lg overflow-hidden">
              <CodeEditor
                language={block.language}
                value={block.code}
                readOnly={true}
                height="200px"
              />
            </div>
          </div>
        );
      } else {
        return (
          <div key={index} className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code
                      className="bg-slate-100 px-1 py-0.5 rounded text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold text-slate-900 mb-3">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold text-slate-900 mb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-slate-700 mb-3 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="text-sm text-slate-700 mb-3 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="text-sm text-slate-700 mb-3 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="ml-4">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-slate-900">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-slate-800">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-200 pl-4 py-2 bg-blue-50 text-slate-700 italic">
                    {children}
                  </blockquote>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {block.content}
            </ReactMarkdown>
          </div>
        );
      }
    });
  };

  return (
    <div className="text-sm">
      {renderMetadata()}
      {renderContent()}
      {renderSources()}
    </div>
  );
};

export default ResponseFormatter;
