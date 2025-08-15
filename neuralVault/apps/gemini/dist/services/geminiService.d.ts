/**
 * Gemini Service for Gmail Integration
 * Handles communication with Google's Gemini AI and function calling.
 */
import { BridgeResponse } from '../types';
export declare class GeminiService {
    private genAI;
    private model;
    private chat;
    private geminiConfig;
    constructor();
    /**
     * Initialize the chat session with system prompt and tools
     */
    private initializeChat;
    /**
     * Process a user message and return Gemini's response
     */
    processMessage(message: string): Promise<BridgeResponse>;
    /**
     * Handle function calls from Gemini
     */
    private handleFunctionCall;
    /**
     * Call the appropriate MCP service function
     */
    private callMCPFunction;
    /**
     * Get list of available functions
     */
    getAvailableFunctions(): string[];
    /**
     * Get help information about available functions
     */
    getFunctionHelp(): string;
    /**
     * Reset the chat session
     */
    resetChat(): void;
    /**
     * Get chat history
     */
    getChatHistory(): any[];
}
export declare function getGeminiService(): GeminiService;
//# sourceMappingURL=geminiService.d.ts.map