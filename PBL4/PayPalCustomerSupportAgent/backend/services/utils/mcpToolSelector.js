const { getToolsDescription } = require("../mcpToolsSchema");

/**
 * AI-based tool selection helper
 * Used by both mcpOnlyHandler and hybridHandler
 */
async function selectAndExecuteTools(
  query,
  genAI,
  mcpTools,
  classification,
  chatHistory = []
) {
  console.log("🤖 Starting AI-based tool selection");

  // Step 1: Present AI with query and available tools
  const toolsDescription = getToolsDescription();
  const conversationContext =
    chatHistory.length > 0
      ? `\n\nPrevious conversation:\n${chatHistory
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n")}`
      : "";

  const toolSelectionPrompt = `You are a tool selection assistant. Based on the user's query, decide which MCP tool(s) to call and what arguments to pass.

${toolsDescription}

User Query: "${query}"
${conversationContext}

Analyze the query and respond with ONLY valid JSON in this exact format:
{
  "tools": [
    {
      "name": "tool_name",
      "arguments": {
        "arg1": "value1",
        "arg2": "value2"
      }
    }
  ]
}

Rules:
- Choose the most appropriate tool(s) for the query
- Extract arguments from the query (e.g., "100 dollar" → amount: 100, fromCurrency: "USD")
- For currency queries, map common terms: "dollar" → "USD", "nrs" → "NPR", "euro" → "EUR", etc.
- For policy queries (policy changes, terms updates, user agreement changes), ALWAYS use search_web tool
- Policy queries should use search_web with the original query or a policy-focused variation
- You can call multiple tools if needed
- If no tool is needed, return empty array: {"tools": []}
- Return ONLY the JSON, no other text`;

  // Step 2: Get AI's tool selection decision
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const toolSelectionResult = await model.generateContent(toolSelectionPrompt);
  const toolSelectionResponse = toolSelectionResult.response.text().trim();

  // Parse AI's tool selection
  let toolCalls = [];
  try {
    let jsonText = toolSelectionResponse.trim();
    // Handle markdown-wrapped JSON
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    const parsed = JSON.parse(jsonText);
    toolCalls = parsed.tools || [];
    console.log("🤖 AI selected tools:", JSON.stringify(toolCalls, null, 2));
  } catch (error) {
    console.error(
      "⚠️ Failed to parse AI tool selection, using fallback:",
      error.message
    );
    console.log("Raw response:", toolSelectionResponse);
    // Will fallback below
  }

  // Step 3: Execute the selected tools
  let mcpData = {};

  if (toolCalls.length > 0) {
    // AI successfully selected tools - execute them
    for (const toolCall of toolCalls) {
      try {
        console.log(`🔧 Executing tool: ${toolCall.name}`, toolCall.arguments);
        const toolResult = await mcpTools.executeTool(
          toolCall.name,
          toolCall.arguments
        );
        if (toolResult) {
          mcpData[toolCall.name] = toolResult;
        }
      } catch (error) {
        console.error(`❌ Error executing ${toolCall.name}:`, error.message);
        mcpData[toolCall.name] = {
          success: false,
          message: `Error: ${error.message}`,
        };
      }
    }
  } else {
    // Fallback mode: use old getToolData method
    console.log("⚠️ Using fallback getToolData method");
    const mcpToolMap = {
      currency: { old: "currency", new: "convert_currency" },
      status_check: { old: "status", new: "check_status" },
      fee_calculation: { old: "feecalculator", new: "calculate_fees" },
      web_search: { old: "websearch", new: "search_web" },
      timeline: { old: "timeline", new: "estimate_timeline" },
    };

    for (const toolName of classification.requires_mcp_tools || []) {
      const toolInfo = mcpToolMap[toolName];
      if (toolInfo) {
        try {
          const toolResult = await mcpTools.getToolData(toolInfo.old, query);
          if (toolResult && toolResult.success) {
            mcpData[toolInfo.new] = toolResult;
          }
        } catch (error) {
          console.error(`Error in fallback for ${toolName}:`, error.message);
        }
      }
    }
  }

  return mcpData;
}

module.exports = { selectAndExecuteTools };
