import React, { useState, useEffect } from "react";
import {
  Code,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Calculator,
  Play,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  getMCPTools,
  callMCPTool,
  enhanceChatContext,
  validateTwilioCode,
  lookupErrorCode,
  detectProgrammingLanguage,
  searchWeb,
  checkTwilioStatus,
  validateWebhookSignature,
  calculateRateLimits,
  executeTwilioCode,
} from "../services/api";

const MCPToolsPanel = ({ onToolResult }) => {
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolArgs, setToolArgs] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedTools, setExpandedTools] = useState({});

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const response = await getMCPTools();
      setTools(response.tools || []);
    } catch (error) {
      console.error("Failed to load MCP tools:", error);
    }
  };

  const executeTool = async (toolName, args) => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await callMCPTool(toolName, args);
      setResult(response);
      if (onToolResult) {
        onToolResult(toolName, response);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
        tool: toolName,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleToolExpansion = (toolName) => {
    setExpandedTools(prev => ({
      ...prev,
      [toolName]: !prev[toolName]
    }));
  };

  const getToolIcon = (toolName) => {
    const iconMap = {
      enhance_chat_context: <Code className="w-4 h-4" />,
      validate_twilio_code: <CheckCircle className="w-4 h-4" />,
      lookup_error_code: <AlertTriangle className="w-4 h-4" />,
      detect_programming_language: <Code className="w-4 h-4" />,
      web_search: <Search className="w-4 h-4" />,
      check_twilio_status: <Clock className="w-4 h-4" />,
      validate_webhook_signature: <Shield className="w-4 h-4" />,
      calculate_rate_limits: <Calculator className="w-4 h-4" />,
      execute_twilio_code: <Play className="w-4 h-4" />,
    };
    return iconMap[toolName] || <Zap className="w-4 h-4" />;
  };

  const renderToolForm = (tool) => {
    const parameters = tool.parameters || {};
    
    return (
      <div className="space-y-3">
        {Object.entries(parameters).map(([paramName, paramInfo]) => (
          <div key={paramName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {paramName}
              {paramInfo.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={paramInfo.type === "number" ? "number" : "text"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={paramInfo.description}
              value={toolArgs[paramName] || ""}
              onChange={(e) =>
                setToolArgs(prev => ({
                  ...prev,
                  [paramName]: paramInfo.type === "number" ? Number(e.target.value) : e.target.value
                }))
              }
            />
            <p className="text-xs text-gray-500 mt-1">{paramInfo.description}</p>
          </div>
        ))}
        <button
          onClick={() => executeTool(tool.name, toolArgs)}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Executing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Execute Tool</span>
            </>
          )}
        </button>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-medium">
            {result.success ? "Tool Executed Successfully" : "Tool Execution Failed"}
          </span>
        </div>
        <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-auto max-h-64">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Zap className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">MCP Tools</h2>
      </div>
      
      <div className="space-y-3">
        {tools.map((tool) => (
          <div key={tool.name} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleToolExpansion(tool.name)}
              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                {getToolIcon(tool.name)}
                <div>
                  <div className="font-medium text-gray-900">{tool.name}</div>
                  <div className="text-sm text-gray-500">{tool.description}</div>
                </div>
              </div>
              {expandedTools[tool.name] ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedTools[tool.name] && (
              <div className="px-4 pb-4 border-t border-gray-200">
                {renderToolForm(tool)}
              </div>
            )}
          </div>
        ))}
      </div>

      {renderResult()}
    </div>
  );
};

export default MCPToolsPanel;
