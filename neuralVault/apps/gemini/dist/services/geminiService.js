"use strict";
/**
 * Gemini Service for Gmail Integration
 * Handles communication with Google's Gemini AI and function calling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
exports.getGeminiService = getGeminiService;
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("../config");
const functionSchemas_1 = require("../schemas/functionSchemas");
const mcpService_1 = require("./mcpService");
class GeminiService {
    genAI;
    model;
    chat = null;
    geminiConfig;
    constructor() {
        this.geminiConfig = config_1.config.getGeminiConfig();
        if (!this.geminiConfig.apiKey) {
            throw new Error('GEMINI_API_KEY is required');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(this.geminiConfig.apiKey);
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
    async initialize() {
        await this.initializeChat();
    }
    /**
     * Initialize the chat session with system prompt and tools
     */
    async initializeChat() {
        try {
            this.chat = this.model.startChat({
                tools: [{
                        functionDeclarations: functionSchemas_1.GMAIL_FUNCTION_SCHEMAS.map(schema => ({
                            name: schema.name,
                            description: schema.description,
                            parameters: {
                                type: schema.parameters.type,
                                properties: schema.parameters.properties,
                                required: schema.parameters.required
                            }
                        }))
                    }]
            });
            // Send the system instruction as the first message
            await this.chat.sendMessage(functionSchemas_1.GEMINI_SYSTEM_PROMPT);
            console.log('✅ Gemini chat session initialized');
        }
        catch (error) {
            console.error('❌ Failed to initialize Gemini chat:', error);
            throw error;
        }
    }
    /**
     * Process a user message and return Gemini's response
     */
    async processMessage(message) {
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
            }
            else {
                return {
                    success: true,
                    message: response.text() || 'No response from Gemini',
                    data: { type: 'text', content: response.text() }
                };
            }
        }
        catch (error) {
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
    async handleFunctionCall(response) {
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
            }
            else {
                throw new Error('Chat session not available');
            }
        }
        catch (error) {
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
    async callMCPFunction(functionName, args) {
        try {
            switch (functionName) {
                case 'list_emails':
                    const listResult = await mcpService_1.mcpService.listEmails({
                        maxResults: args.maxResults || 10,
                        label: args.label || 'INBOX'
                    });
                    if (listResult.success) {
                        return {
                            success: true,
                            message: listResult.message,
                            summary: mcpService_1.mcpService.formatEmailSummary(listResult.emails),
                            emails: listResult.emails
                        };
                    }
                    else {
                        return {
                            success: false,
                            message: listResult.message
                        };
                    }
                case 'search_emails':
                    const searchResult = await mcpService_1.mcpService.searchEmails({
                        query: args.query,
                        maxResults: args.maxResults || 10
                    });
                    if (searchResult.success) {
                        return {
                            success: true,
                            message: searchResult.message,
                            summary: mcpService_1.mcpService.formatEmailSummary(searchResult.emails),
                            emails: searchResult.emails
                        };
                    }
                    else {
                        return {
                            success: false,
                            message: searchResult.message
                        };
                    }
                case 'read_email':
                    const readResult = await mcpService_1.mcpService.readEmail({
                        emailId: args.emailId
                    });
                    if (readResult.success && readResult.email) {
                        return {
                            success: true,
                            message: readResult.message,
                            details: mcpService_1.mcpService.formatEmailDetails(readResult.email),
                            email: readResult.email
                        };
                    }
                    else {
                        return {
                            success: false,
                            message: readResult.message
                        };
                    }
                case 'send_email':
                    const sendResult = await mcpService_1.mcpService.sendEmail({
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
                    }
                    else {
                        return {
                            success: false,
                            message: sendResult.message
                        };
                    }
                case 'get_labels':
                    const labelsResult = await mcpService_1.mcpService.getLabels();
                    if (labelsResult.success) {
                        return {
                            success: true,
                            message: labelsResult.message,
                            labels: labelsResult.labels,
                            count: labelsResult.count
                        };
                    }
                    else {
                        return {
                            success: false,
                            message: labelsResult.message
                        };
                    }
                case 'mark_as_read':
                    const markResult = await mcpService_1.mcpService.markAsRead({
                        emailIds: args.emailIds,
                        read: args.read !== undefined ? args.read : true
                    });
                    if (markResult.success) {
                        return {
                            success: true,
                            message: markResult.message
                        };
                    }
                    else {
                        return {
                            success: false,
                            message: markResult.message
                        };
                    }
                case 'star_emails':
                    const starResult = await mcpService_1.mcpService.starEmails({
                        emailIds: args.emailIds,
                        starred: args.starred !== undefined ? args.starred : true
                    });
                    if (starResult.success) {
                        return {
                            success: true,
                            message: starResult.message
                        };
                    }
                    else {
                        return {
                            success: false,
                            message: starResult.message
                        };
                    }
                case 'move_to_label':
                    const moveResult = await mcpService_1.mcpService.moveToLabel({
                        emailIds: args.emailIds,
                        label: args.label
                    });
                    if (moveResult.success) {
                        return {
                            success: true,
                            message: moveResult.message
                        };
                    }
                    else {
                        return {
                            success: false,
                            message: moveResult.message
                        };
                    }
                case 'reply_to_email':
                    const replyResult = await mcpService_1.mcpService.replyToEmail({
                        emailId: args.emailId,
                        body: args.body,
                        includeOriginal: args.includeOriginal !== undefined ? args.includeOriginal : true
                    });
                    if (replyResult.success) {
                        return {
                            success: true,
                            message: replyResult.message
                        };
                    }
                    else {
                        return {
                            success: false,
                            message: replyResult.message
                        };
                    }
                case 'forward_email':
                    const forwardResult = await mcpService_1.mcpService.forwardEmail({
                        emailId: args.emailId,
                        to: args.to,
                        message: args.message || ''
                    });
                    if (forwardResult.success) {
                        return {
                            success: true,
                            message: forwardResult.message
                        };
                    }
                    else {
                        return {
                            success: false,
                            message: forwardResult.message
                        };
                    }
                case 'get_attachments':
                    const attachmentsResult = await mcpService_1.mcpService.getAttachments({
                        emailId: args.emailId
                    });
                    if (attachmentsResult.success) {
                        return {
                            success: true,
                            message: attachmentsResult.message,
                            attachments: attachmentsResult.attachments,
                            count: attachmentsResult.count
                        };
                    }
                    else {
                        return {
                            success: false,
                            message: attachmentsResult.message
                        };
                    }
                default:
                    return {
                        success: false,
                        message: `Unknown function: ${functionName}`
                    };
            }
        }
        catch (error) {
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
    getAvailableFunctions() {
        return functionSchemas_1.GMAIL_FUNCTION_SCHEMAS.map(func => func.name);
    }
    /**
     * Get help information about available functions
     */
    getFunctionHelp() {
        let helpText = '**Available Gmail Operations:**\n\n';
        functionSchemas_1.GMAIL_FUNCTION_SCHEMAS.forEach(func => {
            helpText += `**${func.name}**\n`;
            helpText += `${func.description}\n\n`;
        });
        return helpText;
    }
    /**
     * Reset the chat session
     */
    async resetChat() {
        await this.initializeChat();
    }
    /**
     * Get chat history
     */
    async getChatHistory() {
        if (!this.chat)
            return [];
        try {
            const history = await this.chat.getHistory();
            return Array.isArray(history) ? history : [];
        }
        catch (error) {
            return [];
        }
    }
}
exports.GeminiService = GeminiService;
// Export singleton instance
let geminiServiceInstance = null;
async function getGeminiService() {
    if (!geminiServiceInstance) {
        geminiServiceInstance = new GeminiService();
        await geminiServiceInstance.initialize();
    }
    return geminiServiceInstance;
}
