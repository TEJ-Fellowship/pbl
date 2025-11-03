import { saveConversation, getConversationHistory, connectToMongoDB, saveUserProfile, getUserProfile, updateUserProfile } from '../repositories/conversationRepository.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import MCPToolsManager from '../mcp/mcpToolsManager.js';

/**
 * Conversation Service - Handles conversation management and AI responses
 */
class ConversationService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.gemini.model });
    this.isInitialized = false;
    this.mcpTools = new MCPToolsManager();
  }

  async initialize() {
    try {
      console.log('💬 Initializing Conversation Service...');
      await connectToMongoDB();
      this.isInitialized = true;
      console.log('✅ Conversation Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Conversation Service initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Check if query is clearly out of Discord context
   * @param {string} query - User query
   * @returns {boolean} True if query is NOT about Discord
   */
  isQueryOutOfDiscordContext(query) {
    const queryLower = query.toLowerCase();
    
    // Discord-related keywords that indicate a Discord question
    const discordKeywords = [
      'discord', 'bot', 'webhook', 'channel', 'server', 'role', 'permission',
      'moderator', 'admin', 'guild', 'member', 'message', 'embed', 'slash command',
      'discord api', 'discord.js', 'discord.py', 'discord support', 'discord help'
    ];
    
    // Check if query contains Discord keywords
    const hasDiscordKeyword = discordKeywords.some(keyword => queryLower.includes(keyword));
    const wordCount = query.trim().split(/\s+/).filter(Boolean).length;
    
    // Treat generic greetings and very short, non-Discord queries as out of context
    const greetingPatterns = [
      /^(hi|hello|hey|yo|sup|howdy)[!.?]*$/i,
      /^good\s+(morning|afternoon|evening)[!.?]*$/i,
      /^how are you\b/i,
      /^who (are|r) you\b/i,
      /^help[!.?]*$/i
    ];
    if (!hasDiscordKeyword) {
      if (greetingPatterns.some(p => p.test(query))) {
        return true;
      }
      // Extremely short generic queries (<= 3 words) without Discord terms
      if (wordCount <= 3) {
        return true;
      }
    }
    
    // Patterns indicating non-Discord queries
    const nonDiscordPatterns = [
      /^what is \d+ \+\s*\d+.*\??$/i,  // Math: "what is 2 + 2?"
      /^what is \d+ \-\s*\d+.*\??$/i,  // Math: "what is 5 - 3?"
      /^what is \d+ \*\s*\d+.*\??$/i,  // Math: "what is 3 * 4?"
      /^what is \d+ \/\s*\d+.*\??$/i,  // Math: "what is 10 / 2?"
      /^calculate/i,  // Math calculations
      /\d+\s*\+\s*\d+/i,  // Contains math operations
      /\d+\s*-\s*\d+/i,
      /\d+\s*\*\s*\d+/i,
      /\d+\s*\/\s*\d+/i,
      /(fellowship|program|university|college|school|course|degree|institute|academy)/i,  // Education/Programs
      /^who is .*(president|prime minister|leader)/i,  // General knowledge
      /^when (did|was|is) .*(happen|occur|begin)/i,  // Historical/general
      /^where (is|are|was|were) .*(located|found)/i,  // Geography
      /^how (many|much|long|far|old|tall)/i  // General how questions (unless Discord-related)
    ];
    
    // If query doesn't have Discord keywords AND matches non-Discord patterns, it's out of context
    if (!hasDiscordKeyword) {
      // Check for explicit non-Discord patterns
      for (const pattern of nonDiscordPatterns) {
        if (pattern.test(query)) {
          return true;
        }
      }
      
      // Additional heuristics: queries starting with "what is" without Discord keywords
      // This catches queries like "what is tej fellowship??"
      if (/^what (is|are) .+$/i.test(query) && query.length < 100) {
        // Simple "what is X?" questions are likely out of context if no Discord keywords
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract user information from query
   * @param {string} query - User query
   * @returns {Object} Extracted user information
   */
  extractUserInfo(query) {
    const userInfo = {};
    
    // Extract name patterns
    const namePatterns = [
      /my name is (\w+)/i,
      /i am (\w+)/i,
      /call me (\w+)/i,
      /i'm (\w+)/i,
      /i'm called (\w+)/i,
      /my name's (\w+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = query.match(pattern);
      if (match) {
        userInfo.name = match[1];
        break;
      }
    }
    
    // Extract other preferences
    if (query.toLowerCase().includes('prefer') || query.toLowerCase().includes('like')) {
      // Could extract preferences here
    }
    
    return userInfo;
  }

  /**
   * Generate AI response using RAG with Discord-style formatting
   * @param {string} query - User query
   * @param {Array} retrievedDocs - Retrieved documents
   * @param {Object} serverContext - Server context information
   * @param {Object} userProfile - User profile information
   * @returns {Promise<string>} AI-generated response
   */
  async generateRAGAnswer(query, retrievedDocs, serverContext = {}, userProfile = {}) {
    try {
      // First, check if query is clearly NOT Discord-related
      const isOutOfContext = this.isQueryOutOfDiscordContext(query);
      const topSimilarity = Array.isArray(retrievedDocs) && retrievedDocs.length > 0
        ? (retrievedDocs[0].similarity ?? 0)
        : 0;
      const hasLowRelevance = !retrievedDocs || retrievedDocs.length === 0 || topSimilarity < 0.3;
      
      let mcpResults = '';
      let isUsingWebSearch = false;

      // If query is out of Discord context OR has low relevance, force web search
      if (isOutOfContext || hasLowRelevance) {
        console.log(`🌐 Query appears out of Discord context or has low relevance.`);
        console.log(`   - Out of context: ${isOutOfContext}`);
        console.log(`   - Low relevance: ${hasLowRelevance} (similarity: ${topSimilarity})`);
        console.log(`   - Triggering web search for: "${query}"`);
        
        try {
          const webSearchResult = await this.executeMCPToolForQuery('free_web_search', query);
          if (webSearchResult && webSearchResult.success && webSearchResult.result) {
            const formatted = this.formatMCPResultForAI(webSearchResult.result, 'free_web_search');
            if (formatted && formatted !== 'No web search results found.') {
              mcpResults += `\n\nMCP Tool Result (free_web_search):\n${formatted}\n`;
              isUsingWebSearch = true;
              console.log('✅ Web search completed successfully with results');
              console.log(`   - Found ${webSearchResult.result.totalResults || 0} results`);
            } else {
              console.log('⚠️ Web search returned no results');
            }
          } else {
            console.log('⚠️ Web search returned unsuccessful result:', webSearchResult?.error || 'Unknown error');
            console.log('   - Web search result object:', JSON.stringify(webSearchResult, null, 2));
          }
        } catch (e) {
          console.error('❌ Web search failed:', e.message);
          console.error('   - Error stack:', e.stack);
        }
      }

      // Check if other MCP tools should be used for this query
      if (!isUsingWebSearch) {
        const mcpSuggestions = this.mcpTools.suggestToolsForQuery(query);
        
        if (mcpSuggestions.length > 0) {
          console.log(`🔧 MCP tools suggested for query: ${mcpSuggestions.map(s => s.tool).join(', ')}`);
          
          // Execute suggested MCP tools (but skip web search if already done)
          for (const suggestion of mcpSuggestions.slice(0, 2)) {
            if (suggestion.tool === 'free_web_search' && isUsingWebSearch) {
              continue; // Skip if web search already executed
            }
            
            try {
              const mcpResult = await this.executeMCPToolForQuery(suggestion.tool, query);
              if (mcpResult && mcpResult.success) {
                const formattedResult = this.formatMCPResultForAI(mcpResult.result, suggestion.tool);
                mcpResults += `\n\nMCP Tool Result (${suggestion.tool}):\n${formattedResult}\n`;
              } else {
                console.log(`MCP tool ${suggestion.tool} returned unsuccessful result:`, mcpResult?.error || 'Unknown error');
              }
            } catch (error) {
              console.error(`MCP tool ${suggestion.tool} failed:`, error.message);
              // Continue with other tools even if one fails
            }
          }
        }
      }

      const context = retrievedDocs.map((doc, index) => 
        `Source ${index + 1} (${doc.metadata.source}):\n${doc.content}\n`
      ).join('\n');

      const serverType = serverContext.type || 'general';
      const serverSize = serverContext.size || 'unknown';
      const userName = userProfile.name || 'there';

      // Determine if this is a Discord-related query
      const isDiscordQuery = !isOutOfContext && !hasLowRelevance && context.trim().length > 0;
      
      let prompt;
      if (isUsingWebSearch || isOutOfContext) {
        // For out-of-context queries, use web search results to answer
        prompt = `You are a helpful, knowledgeable AI assistant. The user has asked a question that is NOT about Discord. Provide a comprehensive, detailed, and engaging answer based on the web search results provided below.

**CRITICAL INSTRUCTIONS:**
- Do NOT mention Discord or relate to Discord features.
- Do NOT invent facts. Only use information from the web search results, but you CAN expand on what's provided to give context and explanations.
- Do NOT include raw URLs in your response. URLs are for your reference only.
- Structure your answer clearly and professionally - avoid messy formatting.
- Be comprehensive and detailed - similar to how you would answer Discord-related queries.

User Question: ${query}
${userName ? `User Context: The user's name is ${userName}` : ''}

Web Search Results:
${mcpResults}

${context.trim().length > 0 ? `\nNote: Discord documentation is present but NOT relevant to this query. Ignore it entirely.\n` : ''}

**Answer Format Requirements:**

1. **Start with a friendly, engaging greeting** that acknowledges the question and sets a positive tone (use emojis like 👋💬🌟 to make it welcoming)

2. **Provide a comprehensive, well-structured answer:**
   - If asking "what is X?", include:
     * A clear, detailed definition or overview with context  
     * Background or origin if available  
     * Key features, characteristics, or components  
     * Purpose, goals, or real-world significance  
     * Related concepts, technologies, or connections  
   - If asking for a list (e.g., "five tools"), include:
     * That exact number of items, each clearly numbered or bulleted  
     * Detailed explanations for each (what it does, why it matters, and how it’s used)  
     * A brief comparison or summary if relevant  
   - Organize content into clear, logical sections  
   - Expand on findings: explain what they mean, connect ideas, and give context  
   - Use bullet points for lists and numbered lists for steps or rankings  

3. **Response length (BE COMPREHENSIVE):**
   - 0 results: Around ~100 words explaining no information found + helpful suggestions or next steps  
   - 1–2 results: ~200–300 words with detailed explanations and added context  
   - 3+ results: ~400–600 words (flexible depending on topic complexity) including:
     * In-depth explanations  
     * Clear, organized sections  
     * Synthesized information across multiple sources  
     * Additional insights and relevant background  

4. **Formatting style (same as Discord responses):**
   - Use **bold** for important terms, names, and main ideas  
   - Use \`code blocks\` for tool names, commands, or technical terms  
   - Use > blockquotes for important notes, warnings, or takeaways  
   - Use • for bullet lists and numbers (1, 2, 3) for ordered sequences  
   - Add proper spacing and clear sections for readability  
   - Include relevant emojis throughout (📚 💡 ✅ 🔍 🚀 ⚙️ ⚠️ 🎯 💻 🌟 📖 🎓) for engagement  

5. **Engagement and style:**
   - Maintain a friendly, conversational tone  
   - Explain concepts thoroughly — don’t just list facts  
   - Connect related information and make transitions smooth  
   - Keep the response engaging, helpful, and easy to read  
   - Add enthusiasm or friendly phrasing to make it interesting  

6. **Synthesis and depth:**
   - Combine information from **all available search results** into a cohesive, unified answer  
   - Avoid listing — synthesize, explain, and expand  
   - Emphasize the **why** and **how**, not just the **what**  
   - Highlight relationships, context, and significance of the information  
   - Provide meaningful insights or patterns where possible  

7. **Structure example for "What is X?":**
   - Friendly greeting 👋  
   - Clear, detailed definition with context  
   - Background or origin if available  
   - Key features or characteristics explained  
   - Purpose, goals, or significance  
   - Related concepts or connections  
   - Friendly closing inviting follow-up ✨  

8. **End with a friendly, encouraging closing** that offers to help with follow-up questions or provide additional clarification.


Now provide a comprehensive, detailed, and engaging answer that thoroughly addresses the user's question based on the web search results above. Be detailed, explain context, and provide a rich, informative response:`;
      } else {
        // For Discord-related queries, use the existing Discord-focused prompt
        prompt = `You are a Discord Community Support Agent. Answer this question based on the Discord documentation provided.

User Question: ${query}
User Context: ${userName ? `The user's name is ${userName}` : 'No user name provided'}
Server Context: ${serverType} server (${serverSize} members)

Discord Documentation:
${context}
${mcpResults}

Instructions:
1. Provide a comprehensive, detailed answer based on the context above
2. Use Discord-specific terminology correctly (channels, roles, permissions, etc.)
3. Format your response with Discord-style markdown:
   - Use **bold** for important terms and features
   - Use \`code blocks\` for commands, settings, and technical terms
   - Use > blockquotes for important notes and warnings
   - Use bullet points for step-by-step instructions
   - Use numbered lists for sequential steps
4. Include relevant Discord emojis throughout your response:
   - ⚙️ for settings and configuration
   - 🔒 for permissions and security
   - ➕ for adding/creating things
   - 📝 for naming and editing
   - 🎮 for gaming-related content
   - 📚 for educational content
   - 👥 for community features
   - 🎨 for customization
   - ✅ for completion/success
   - ⚠️ for warnings
   - 💡 for tips
   - 🚀 for getting started
   - 🎯 for targeting specific features
5. Make your response longer and more detailed - aim for 200-400 words
6. Include practical examples and use cases
7. Add helpful tips and best practices
8. Be friendly and encouraging like a Discord community manager
9. If there are step-by-step instructions, present them clearly with emojis
10. End with an encouraging message and offer to help with follow-up questions
11. If MCP tool results are provided, integrate them naturally into your response

Answer:`;
      }

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();
      // Compact and format URLs in the final answer for clean display
      const cleanedText = this.compactUrls(rawText);
      return cleanedText;
      
    } catch (error) {
      console.error("Error generating answer:", error.message);
      console.error("Error details:", error);
      
      // Try to provide a basic response even if AI generation fails
      if (retrievedDocs && retrievedDocs.length > 0) {
        return `I found some relevant information about your question, but I'm having trouble generating a complete response right now. Here's what I found:\n\n${retrievedDocs.slice(0, 2).map((doc, index) => 
          `**Source ${index + 1}:** ${doc.metadata.source || 'Unknown'}\n${doc.content.substring(0, 200)}...`
        ).join('\n\n')}\n\nPlease try rephrasing your question or contact support if the issue persists.`;
      }
      
      return "I apologize, but I'm having trouble generating an answer right now. Please try again or contact support if the issue persists.";
    }
  }

  /**
   * Compact long/redirected URLs in text for clean display
   * - Decodes DuckDuckGo redirect URLs (uddg=)
   * - Shortens very long URLs to host + path with ellipsis
   * - Wraps displayed URL in backticks to avoid layout issues
   * @param {string} text
   * @returns {string}
   */
  compactUrls(text) {
    if (!text || typeof text !== 'string') return text;

    const decodeDuckDuckGoUrl = (url) => {
      try {
        const match = url.match(/uddg=([^&]+)/);
        if (match) {
          return decodeURIComponent(match[1]);
        }
        return url;
      } catch {
        return url;
      }
    };

    const shorten = (urlStr) => {
      try {
        const original = decodeDuckDuckGoUrl(urlStr);
        const u = new URL(original);
        const base = `${u.hostname}${u.pathname}`;
        const queryIndicator = u.search ? '?' : '';
        const display = `${base}${queryIndicator}`;
        // Limit display length; keep it readable
        if (display.length > 70) {
          return `\`${display.slice(0, 67)}...\``;
        }
        return `\`${display}\``;
      } catch {
        // Fallback: trim plain string if not a valid URL
        const trimmed = urlStr.length > 70 ? `${urlStr.slice(0, 67)}...` : urlStr;
        return `\`${trimmed}\``;
      }
    };

    return text.replace(/https?:\/\/[^\s)]+/g, (m) => shorten(m));
  }

  /**
   * Execute MCP tool for a specific query
   * @param {string} toolName - Name of the MCP tool
   * @param {string} query - User query
   * @returns {Promise<Object>} MCP tool result
   */
  async executeMCPToolForQuery(toolName, query) {
    try {
      switch (toolName) {
        case 'free_web_search':
          return await this.mcpTools.executeTool('free_web_search', { query });
        
        case 'discord_permission_calculator':
          // Extract permission-related information from query
          const permissionParams = this.extractPermissionParams(query);
          return await this.mcpTools.executeTool('discord_permission_calculator', permissionParams);
        
        case 'discord_bot_token_validator':
          // Extract token from query (if present)
          const tokenParams = this.extractTokenParams(query);
          if (tokenParams.token) {
            return await this.mcpTools.executeTool('discord_bot_token_validator', tokenParams);
          }
          return { success: false, error: 'No token found in query' };
        
        case 'discord_webhook_tester':
          // Extract webhook URL from query
          const webhookParams = this.extractWebhookParams(query);
          if (webhookParams.webhookUrl) {
            return await this.mcpTools.executeTool('discord_webhook_tester', webhookParams);
          }
          return { success: false, error: 'No webhook URL found in query' };
        
        case 'discord_status_checker':
          // Check Discord status
          return await this.mcpTools.executeTool('discord_status_checker', { checkType: 'all' });
        
        case 'discord_role_hierarchy_checker':
          // Extract role data from query
          const roleParams = this.extractRoleParams(query);
          if (roleParams.roles && roleParams.roles.length > 0) {
            return await this.mcpTools.executeTool('discord_role_hierarchy_checker', roleParams);
          }
          return { success: false, error: 'No role data found in query' };
        
        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract permission parameters from query
   * @param {string} query - User query
   * @returns {Object} Permission parameters
   */
  extractPermissionParams(query) {
    const queryLower = query.toLowerCase();
    
    // Check for specific actions
    if (queryLower.includes('calculate') || queryLower.includes('bitfield')) {
      return { action: 'calculate', permissions: this.extractPermissionNames(query) };
    } else if (queryLower.includes('parse') || queryLower.includes('decode')) {
      return { action: 'parse', bitfield: this.extractBitfield(query) };
    } else if (queryLower.includes('validate') || queryLower.includes('check')) {
      return { action: 'validate', permissions: this.extractPermissionNames(query) };
    }
    
    // Default to calculate
    return { action: 'calculate', permissions: this.extractPermissionNames(query) };
  }

  /**
   * Extract permission names from query
   * @param {string} query - User query
   * @returns {Array} Array of permission names
   */
  extractPermissionNames(query) {
    const permissionKeywords = [
      'ADMINISTRATOR', 'MANAGE_GUILD', 'MANAGE_CHANNELS', 'MANAGE_ROLES',
      'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_MESSAGES', 'SEND_MESSAGES',
      'VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'MANAGE_WEBHOOKS'
    ];
    
    const foundPermissions = [];
    const queryUpper = query.toUpperCase();
    
    permissionKeywords.forEach(permission => {
      if (queryUpper.includes(permission)) {
        foundPermissions.push(permission);
      }
    });
    
    return foundPermissions;
  }

  /**
   * Extract bitfield from query
   * @param {string} query - User query
   * @returns {string|null} Bitfield value
   */
  extractBitfield(query) {
    const bitfieldMatch = query.match(/\b\d+\b/);
    return bitfieldMatch ? bitfieldMatch[0] : null;
  }

  /**
   * Extract webhook parameters from query
   * @param {string} query - User query
   * @returns {Object} Webhook parameters
   */
  extractWebhookParams(query) {
    // Look for webhook URL patterns
    const webhookUrlPattern = /https:\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/;
    const webhookMatch = query.match(webhookUrlPattern);
    
    return {
      webhookUrl: webhookMatch ? webhookMatch[0] : null,
      testMessage: 'Test message from Discord Support Agent',
      testEmbed: query.toLowerCase().includes('embed'),
      testFile: query.toLowerCase().includes('file'),
      validateOnly: query.toLowerCase().includes('validate only')
    };
  }

  /**
   * Extract role parameters from query
   * @param {string} query - User query
   * @returns {Object} Role parameters
   */
  extractRoleParams(query) {
    // This is a simplified extraction - in a real implementation,
    // you might want to parse role data from a more structured format
    const roles = [];
    
    // Look for role mentions or role data patterns
    const roleMentions = query.match(/<@&\d+>/g) || [];
    
    if (roleMentions.length > 0) {
      // Mock role data for demonstration
      roleMentions.forEach((mention, index) => {
        roles.push({
          id: `role_${index}`,
          name: `Role ${index + 1}`,
          position: index,
          permissions: Math.floor(Math.random() * 1000000), // Mock permissions
          color: 0x3498db,
          hoist: false,
          mentionable: true,
          managed: false
        });
      });
    }
    
    return {
      roles,
      checkPermissions: !query.toLowerCase().includes('no permissions'),
      checkConflicts: !query.toLowerCase().includes('no conflicts'),
      checkInheritance: !query.toLowerCase().includes('no inheritance'),
      detailed: query.toLowerCase().includes('detailed')
    };
  }

  /**
   * Format MCP tool result for AI consumption
   * @param {Object} result - MCP tool result
   * @param {string} toolName - Name of the MCP tool
   * @returns {string} Formatted result string
   */
  formatMCPResultForAI(result, toolName) {
    try {
      switch (toolName) {
        case 'free_web_search':
          return this.formatWebSearchResult(result);
        
        case 'discord_permission_calculator':
          return this.formatPermissionCalculatorResult(result);
        
        case 'discord_bot_token_validator':
          return this.formatTokenValidatorResult(result);
        
        case 'discord_webhook_tester':
          return this.formatWebhookTesterResult(result);
        
        case 'discord_status_checker':
          return this.formatStatusCheckerResult(result);
        
        case 'discord_role_hierarchy_checker':
          return this.formatRoleHierarchyResult(result);
        
        default:
          return JSON.stringify(result, null, 2);
      }
    } catch (error) {
      console.error(`Error formatting MCP result for ${toolName}:`, error.message);
      return `MCP tool result: ${JSON.stringify(result, null, 2)}`;
    }
  }

  /**
   * Format web search result
   * @param {Object} result - Web search result
   * @returns {string} Formatted result
   */
  formatWebSearchResult(result) {
    if (!result.results || result.results.length === 0) {
      return 'No web search results found.';
    }

    // Helper to clean DuckDuckGo redirect URLs
    const cleanUrl = (url) => {
      if (!url) return '';
      // Extract actual URL from DuckDuckGo redirect
      const uddgMatch = url.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        try {
          return decodeURIComponent(uddgMatch[1]);
        } catch (e) {
          return url;
        }
      }
      // Remove DuckDuckGo redirect wrapper if present
      if (url.includes('duckduckgo.com/l/?')) {
        const urlMatch = url.match(/uddg=([^&]+)/);
        if (urlMatch) {
          try {
            return decodeURIComponent(urlMatch[1]);
          } catch (e) {
            return url;
          }
        }
      }
      return url;
    };

    let formatted = `Web Search Results (${result.totalResults} found):\n\n`;
    result.results.slice(0, 5).forEach((item, index) => {
      const cleanTitle = item.title || 'Untitled';
      const cleanUrlStr = cleanUrl(item.url || '');
      const cleanDesc = item.description || 'No description available';
      
      formatted += `Result ${index + 1}:\n`;
      formatted += `Title: ${cleanTitle}\n`;
      if (cleanUrlStr && !cleanUrlStr.includes('duckduckgo.com')) {
        formatted += `Source: ${cleanUrlStr}\n`;
      }
      formatted += `Content: ${cleanDesc}\n\n`;
    });

    return formatted;
  }

  /**
   * Format permission calculator result
   * @param {Object} result - Permission calculator result
   * @returns {string} Formatted result
   */
  formatPermissionCalculatorResult(result) {
    if (!result.success) {
      return `Permission calculation failed: ${result.error}`;
    }

    let formatted = `Permission Calculation Result:\n`;
    formatted += `Bitfield: ${result.bitfield}\n`;
    formatted += `Permissions: ${result.permissions.map(p => p.name).join(', ')}\n`;
    
    if (result.warnings && result.warnings.length > 0) {
      formatted += `Warnings: ${result.warnings.map(w => w.message).join('; ')}\n`;
    }

    return formatted;
  }

  /**
   * Format token validator result
   * @param {Object} result - Token validator result
   * @returns {string} Formatted result
   */
  formatTokenValidatorResult(result) {
    if (!result.success) {
      return `Token validation failed: ${result.error}`;
    }

    let formatted = `Token Validation Result:\n`;
    formatted += `Valid: ${result.valid ? 'Yes' : 'No'}\n`;
    
    if (result.botInfo) {
      formatted += `Bot Username: ${result.botInfo.username}\n`;
      formatted += `Bot ID: ${result.botInfo.id}\n`;
      formatted += `Verified: ${result.botInfo.verified ? 'Yes' : 'No'}\n`;
    }

    if (result.warnings && result.warnings.length > 0) {
      formatted += `Warnings: ${result.warnings.map(w => w.message).join('; ')}\n`;
    }

    return formatted;
  }

  /**
   * Format webhook tester result
   * @param {Object} result - Webhook tester result
   * @returns {string} Formatted result
   */
  formatWebhookTesterResult(result) {
    if (!result.success) {
      return `Webhook test failed: ${result.error}`;
    }

    let formatted = `Webhook Test Result:\n`;
    formatted += `Valid: ${result.valid ? 'Yes' : 'No'}\n`;
    
    if (result.testResults) {
      formatted += `Tests Performed: ${result.testResults.tests.length}\n`;
      formatted += `Response Time: ${result.testResults.responseTime}ms\n`;
      
      const successfulTests = result.testResults.tests.filter(t => t.success);
      formatted += `Successful Tests: ${successfulTests.length}/${result.testResults.tests.length}\n`;
    }

    if (result.recommendations && result.recommendations.length > 0) {
      formatted += `Recommendations: ${result.recommendations.map(r => r.message).join('; ')}\n`;
    }

    return formatted;
  }

  /**
   * Format status checker result
   * @param {Object} result - Status checker result
   * @returns {string} Formatted result
   */
  formatStatusCheckerResult(result) {
    if (!result.success) {
      return `Status check failed: ${result.error}`;
    }

    const results = result.results;
    let formatted = `Discord Status Check Result:\n`;
    formatted += `Overall Status: ${results.overallStatus}\n`;
    
    if (results.summary && results.summary.overall) {
      formatted += `Health: ${results.summary.overall.health}\n`;
      formatted += `Message: ${results.summary.overall.message}\n`;
      
      if (results.summary.overall.alerts && results.summary.overall.alerts.length > 0) {
        formatted += `Alerts: ${results.summary.overall.alerts.map(a => a.message).join('; ')}\n`;
      }
    }

    if (results.components && results.components.length > 0) {
      formatted += `Components Status:\n`;
      results.components.slice(0, 5).forEach(component => {
        formatted += `- ${component.name}: ${component.status}\n`;
      });
    }

    if (results.incidents && results.incidents.length > 0) {
      formatted += `Active Incidents: ${results.incidents.length}\n`;
      results.incidents.slice(0, 2).forEach(incident => {
        formatted += `- ${incident.name}: ${incident.status}\n`;
      });
    }

    return formatted;
  }

  /**
   * Format role hierarchy result
   * @param {Object} result - Role hierarchy result
   * @returns {string} Formatted result
   */
  formatRoleHierarchyResult(result) {
    if (!result.success) {
      return `Role hierarchy check failed: ${result.error}`;
    }

    const results = result.results;
    let formatted = `Role Hierarchy Check Result:\n`;
    formatted += `Valid: ${results.valid ? 'Yes' : 'No'}\n`;
    formatted += `Total Roles: ${results.roles.length}\n`;
    
    if (results.hierarchy) {
      formatted += `Highest Position: ${results.hierarchy.highestPosition}\n`;
      formatted += `Issues Found: ${results.hierarchy.issues.length}\n`;
    }

    if (results.conflicts && results.conflicts.length > 0) {
      formatted += `Conflicts: ${results.conflicts.map(c => c.message).join('; ')}\n`;
    }

    if (results.recommendations && results.recommendations.length > 0) {
      formatted += `Recommendations: ${results.recommendations.map(r => r.message).join('; ')}\n`;
    }

    return formatted;
  }

  /**
   * Process a complete conversation turn
   * @param {string} query - User query
   * @param {Array} searchResults - Search results from search service
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Complete response object
   */
  async processConversation(query, searchResults, options = {}) {
    const {
      sessionId = 'default',
      serverContext = {},
      enableReranking = false
    } = options;

    try {
      // Extract user information from query
      const extractedUserInfo = this.extractUserInfo(query);
      
      // Get existing user profile
      let userProfile = await getUserProfile(sessionId) || {};
      
      // Update user profile if new information was extracted
      if (extractedUserInfo.name && extractedUserInfo.name !== userProfile.name) {
        userProfile = { ...userProfile, ...extractedUserInfo };
        await saveUserProfile(sessionId, userProfile);
        console.log(`👤 User name updated: ${extractedUserInfo.name}`);
      }

      // Generate AI response with user context
      const answer = await this.generateRAGAnswer(query, searchResults, serverContext, userProfile);

      // Prepare response object
      const response = {
        success: true,
        query,
        answer,
        results: searchResults.map(doc => ({
          content: doc.content,
          source: doc.metadata.source,
          combinedScore: doc.similarity,
          score: doc.similarity,
          metadata: doc.metadata,
          semanticScore: doc.semanticScore,
          keywordScore: doc.keywordScore,
          crossEncoderScore: doc.crossEncoderScore
        })),
        sources: searchResults.map(doc => ({
          source: doc.metadata.source,
          similarity: doc.similarity,
          semanticScore: doc.semanticScore,
          keywordScore: doc.keywordScore,
          crossEncoderScore: doc.crossEncoderScore
        })),
        sessionId,
        searchMethod: searchResults[0]?.searchMethod || 'unknown',
        features: {
          hybridSearch: true,
          reranking: enableReranking,
          serverContext: Object.keys(serverContext).length > 0
        },
        timestamp: new Date().toISOString()
      };

      // Save conversation to database (async, don't wait)
      this.saveConversationAsync(sessionId, query, searchResults, serverContext);

      return response;

    } catch (error) {
      console.error('❌ Conversation processing failed:', error.message);
      return {
        success: false,
        query,
        answer: "I apologize, but I'm having trouble processing your request right now.",
        results: [],
        sources: [],
        sessionId,
        searchMethod: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Save conversation asynchronously (don't block response)
   * @param {string} sessionId - Session identifier
   * @param {string} query - User query
   * @param {Array} results - Search results
   * @param {Object} serverContext - Server context
   */
  async saveConversationAsync(sessionId, query, results, serverContext) {
    try {
      await saveConversation(sessionId, query, results, {
        serverContext,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('⚠️ Failed to save conversation:', error.message);
      // Don't throw - this is not critical for the response
    }
  }

  /**
   * Get conversation history for a session
   * @param {string} sessionId - Session identifier
   * @param {number} limit - Number of recent conversations to retrieve
   * @returns {Promise<Array>} Conversation history
   */
  async getConversationHistory(sessionId, limit = 10) {
    try {
      return await getConversationHistory(sessionId, limit);
    } catch (error) {
      console.error('❌ Failed to get conversation history:', error.message);
      return [];
    }
  }

  /**
   * Format response for different output types
   * @param {Object} response - Response object
   * @param {string} format - Output format ('json', 'text', 'discord')
   * @returns {string|Object} Formatted response
   */
  formatResponse(response, format = 'json') {
    switch (format) {
      case 'text':
        return response.answer;
      
      case 'discord':
        return {
          content: response.answer,
          embeds: response.sources.map(source => ({
            title: `Source: ${source.source}`,
            description: source.similarity ? `Similarity: ${(source.similarity * 100).toFixed(1)}%` : '',
            color: 0x5865F2 // Discord blue
          }))
        };
      
      case 'json':
      default:
        return response;
    }
  }
}

// Export singleton instance
export default new ConversationService();
