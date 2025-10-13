import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./index.js";

class GeminiConfig {
  constructor() {
    (this.genAI = null), (this.model = null);
  }

  initialize() {
    try {
      if (!config.gemini.apiKey || config.gemini.apiKey === "your_api_key_here") {
        console.warn("⚠️ Gemini API key not set or using placeholder. Some features will be limited.");
        this.genAI = null;
        this.model = null;
        return false;
      }

      this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);

      this.model = this.genAI.getGenerativeModel({
        model: config.gemini.model,
      });

      console.log("Gemini AI initialized successfully");
      return true;
    } catch (error) {
      console.error("Gemini AI failed to initialize", error.message);
      this.genAI = null;
      this.model = null;
      return false;
    }
  }

  async generateEmbedding(text) {
    try {
      if (!this.genAI) {
        console.warn("⚠️ Gemini API not available, using fallback embedding");
        // Return a simple hash-based embedding as fallback
        return this.generateFallbackEmbedding(text);
      }

      const embeddingModel = this.genAI.getGenerativeModel({
        model: "text-embedding-004",
      });

      const result = await embeddingModel.embedContent(text);

      return result.embedding.values;
    } catch (error) {
      console.error("Failed to generated embedding", error.message);
      console.warn("Using fallback embedding");
      return this.generateFallbackEmbedding(text);
    }
  }

  generateFallbackEmbedding(text) {
    // Simple hash-based embedding for fallback
    const hash = this.simpleHash(text);
    const embedding = new Array(768).fill(0);
    
    // Distribute hash values across embedding dimensions
    for (let i = 0; i < 768; i++) {
      embedding[i] = Math.sin(hash + i) * 0.1;
    }
    
    return embedding;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async generateResponse(prompt, context = "") {
    try {
      if (!this.model) {
        console.warn("⚠️ Gemini API not available, using fallback response");
        return this.generateFallbackResponse(prompt, context);
      }

      const fullPrompt = context
        ? `Context: ${context}\n\nQuestion:${prompt}\n\nAnswer based on the context: `
        : prompt;
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;

      return response.text();
    } catch (error) {
      console.error("Failed to generate response:", error.message);
      console.warn("Using fallback response");
      return this.generateFallbackResponse(prompt, context);
    }
  }

  generateFallbackResponse(prompt, context = "") {
    // Simple fallback response based on keywords
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes("bot") && lowerPrompt.includes("admin")) {
      return `🤖 **Adding a Bot with Admin Permissions**

To add a bot with admin permissions to your Discord server:

1. **Find the Bot**: Go to the bot's page (like top.gg, discord.bots.gg, or the bot's website)
2. **Get Invite Link**: Click "Invite" or "Add to Server"
3. **Select Your Server**: Choose which server to add the bot to
4. **Review Permissions**: The bot will show what permissions it needs
5. **Authorize**: Click "Authorize" to add the bot

**⚠️ Important Security Notes:**
- Only add bots from trusted sources
- Review permissions carefully before authorizing
- Admin permissions give the bot full control over your server
- Consider using specific permissions instead of admin when possible

**Alternative: Custom Bot Setup**
If you're creating your own bot:
1. Go to Discord Developer Portal
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token
5. Use the OAuth2 URL generator to create invite link
6. Set appropriate permissions (not necessarily admin)

${context ? `\n**Context from Documentation:**\n${context.substring(0, 500)}...` : ''}`;
    }
    
    if (lowerPrompt.includes("permission")) {
      return `🔒 **Discord Permissions Guide**

Discord permissions control what users and bots can do in your server:

**Permission Categories:**
- **General**: Manage server, view channels, manage roles
- **Text**: Send messages, manage messages, read message history
- **Voice**: Connect, speak, use voice activity
- **Advanced**: Administrator, manage webhooks, manage emojis

**Best Practices:**
- Use role-based permissions instead of individual user permissions
- Follow the principle of least privilege
- Regularly review and audit permissions
- Be cautious with admin permissions

${context ? `\n**Context from Documentation:**\n${context.substring(0, 500)}...` : ''}`;
    }
    
    return `🤖 **Discord Support Assistant**

I'm here to help with Discord server management! Based on your question about "${prompt}", here's some general guidance:

**Common Discord Tasks:**
- Server setup and configuration
- Role and permission management
- Bot integration and management
- Moderation tools and techniques
- Community guidelines and safety

**Getting Help:**
- Check Discord's official support center
- Review server settings and permissions
- Consult the Discord Developer Documentation for technical questions

${context ? `\n**Context from Documentation:**\n${context.substring(0, 500)}...` : ''}

*Note: For more specific help, please provide more details about what you're trying to accomplish.*`;
  }

  async generateQueryEmbedding(query) {
    try {
      if (!this.genAI) {
        console.warn("⚠️ Gemini API not available, using fallback query embedding");
        return this.generateFallbackEmbedding(query);
      }

      const embeddingModel = this.genAI.getGenerativeModel({
        model: "text-embedding-004",
      });

      const result = await embeddingModel.embedContent(query);
      return result.embedding.values;
    } catch (error) {
      console.error("Failed to generate query embedding: ", error.message);
      console.warn("Using fallback query embedding");
      return this.generateFallbackEmbedding(query);
    }
  }
}

export default GeminiConfig;
