/**
 * Gemini Service for Gmail Integration
 * Handles communication with Google's Gemini AI and function calling.
 */

import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import {
  GeminiFunctionCall,
  GeminiFunctionResponse,
  GeminiConfig,
  BridgeResponse
} from '../types';
import { config } from '../config';
import { GMAIL_FUNCTION_SCHEMAS, GEMINI_SYSTEM_PROMPT } from '../schemas/functionSchemas';
import { mcpService } from './mcpService';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private chat: ChatSession | null = null;
  private geminiConfig: GeminiConfig;

  constructor() {
    this.geminiConfig = config.getGeminiConfig();
    
    if (!this.geminiConfig.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.genAI = new GoogleGenerativeAI(this.geminiConfig.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: this.geminiConfig.model,
      generationConfig: {
        maxOutputTokens: this.geminiConfig.maxTokens || 4096,
        temperature: this.geminiConfig.temperature || 0.7,
      },
    });
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    await this.initializeChat();
  }

  /**
   * Initialize the chat session with system prompt and tools
   */
  private async initializeChat(): Promise<void> {
    try {
      this.chat = this.model.startChat({
        tools: [{
          functionDeclarations: GMAIL_FUNCTION_SCHEMAS.map(schema => ({
            name: schema.name,
            description: schema.description,
            parameters: {
              type: schema.parameters.type as any,
              properties: schema.parameters.properties,
              required: schema.parameters.required
            }
          }))
        }]
      });

      // Send the system instruction as the first message
      await this.chat.sendMessage(GEMINI_SYSTEM_PROMPT);

      console.log('✅ Gemini chat session initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini chat:', error);
      throw error;
    }
  }

  /**
   * Process a user message and return Gemini's response
   */
  public async processMessage(message: string): Promise<BridgeResponse> {
    try {
      if (!this.chat) {
        throw new Error('Chat session not initialized');
      }

      console.log(`🤖 Processing: ${message}`);

      const result = await this.chat.sendMessage(message);
      const response = result.response;

      // Check if Gemini wants to call a function
      if (response.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
        return await this.handleFunctionCall(response);
      } else {
        return {
          success: true,
          message: response.text() || 'No response from Gemini',
          data: { type: 'text', content: response.text() }
        };
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      return {
        success: false,
        message: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle function calls from Gemini
   */
  private async handleFunctionCall(response: any): Promise<BridgeResponse> {
    try {
      const functionCall = response.candidates[0].content.parts[0].functionCall;
      const functionName = functionCall.name;
      const arguments_ = functionCall.args;

      console.log(`🔧 Calling function: ${functionName}`);
      console.log(`📋 Arguments:`, arguments_);

      // Call the appropriate MCP service function
      const result = await this.callMCPFunction(functionName, arguments_);

      // Send the result back to Gemini
      if (this.chat) {
        const functionResponse = await this.chat.sendMessage([
          {
            functionResponse: {
              name: functionName,
              response: result
            }
          }
        ]);

        return {
          success: true,
          message: functionResponse.response.text() || 'Function executed successfully',
          data: { 
            type: 'function_result', 
            functionName, 
            result,
            geminiResponse: functionResponse.response.text()
          }
        };
      } else {
        throw new Error('Chat session not available');
      }
    } catch (error) {
      console.error('❌ Error handling function call:', error);
      return {
        success: false,
        message: `Sorry, I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Call the appropriate MCP service function
   */
  private async callMCPFunction(functionName: string, args: Record<string, any>): Promise<any> {
    try {
      switch (functionName) {
        case 'list_emails':
          const listResult = await mcpService.listEmails({
            maxResults: args.maxResults || 10,
            label: args.label || 'INBOX'
          });

          if (listResult.success) {
            return {
              success: true,
              message: listResult.message,
              summary: mcpService.formatEmailSummary(listResult.emails),
              emails: listResult.emails
            };
          } else {
            return {
              success: false,
              message: listResult.message
            };
          }

        case 'search_emails':
          const searchResult = await mcpService.searchEmails({
            query: args.query,
            maxResults: args.maxResults || 10
          });

          if (searchResult.success) {
            return {
              success: true,
              message: searchResult.message,
              summary: mcpService.formatEmailSummary(searchResult.emails),
              emails: searchResult.emails
            };
          } else {
            return {
              success: false,
              message: searchResult.message
            };
          }

        case 'read_email':
          const readResult = await mcpService.readEmail({
            emailId: args.emailId
          });

          if (readResult.success && readResult.email) {
            return {
              success: true,
              message: readResult.message,
              details: mcpService.formatEmailDetails(readResult.email),
              email: readResult.email
            };
          } else {
            return {
              success: false,
              message: readResult.message
            };
          }

        case 'send_email':
          const sendResult = await mcpService.sendEmail({
            to: args.to,
            subject: args.subject,
            body: args.body,
            cc: args.cc,
            bcc: args.bcc
          });

          if (sendResult.success) {
            return {
              success: true,
              message: sendResult.message,
              to: sendResult.to,
              subject: sendResult.subject
            };
          } else {
            return {
              success: false,
              message: sendResult.message
            };
          }

        case 'get_labels':
          const labelsResult = await mcpService.getLabels();

          if (labelsResult.success) {
            let labelsSummary = `Found ${labelsResult.count} labels:\n`;
            labelsResult.labels.forEach(label => {
              labelsSummary += `- ${label.name}\n`;
            });

            return {
              success: true,
              message: labelsResult.message,
              summary: labelsSummary,
              labels: labelsResult.labels
            };
          } else {
            return {
              success: false,
              message: labelsResult.message
            };
          }

        default:
          return {
            success: false,
            message: `Unknown function: ${functionName}`
          };
      }
    } catch (error) {
      console.error(`❌ Error calling MCP function ${functionName}:`, error);
      return {
        success: false,
        message: `Error executing ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get list of available functions
   */
  public getAvailableFunctions(): string[] {
    return GMAIL_FUNCTION_SCHEMAS.map(func => func.name);
  }

  /**
   * Get help information about available functions
   */
  public getFunctionHelp(): string {
    let helpText = '**Available Gmail Operations:**\n\n';
    
    GMAIL_FUNCTION_SCHEMAS.forEach(func => {
      helpText += `**${func.name}**\n`;
      helpText += `${func.description}\n\n`;
    });

    return helpText;
  }

  /**
   * Reset the chat session
   */
  public async resetChat(): Promise<void> {
    await this.initializeChat();
  }

  /**
   * Get chat history
   */
  public async getChatHistory(): Promise<any[]> {
    if (!this.chat) return [];
    try {
      const history = await this.chat.getHistory();
      return Array.isArray(history) ? history : [];
    } catch (error) {
      return [];
    }
  }
}

// Export singleton instance
let geminiServiceInstance: GeminiService | null = null;

export async function getGeminiService(): Promise<GeminiService> {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService();
    await geminiServiceInstance.initialize();
  }
  return geminiServiceInstance;
}
