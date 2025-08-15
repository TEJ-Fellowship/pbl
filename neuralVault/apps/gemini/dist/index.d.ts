#!/usr/bin/env node
/**
 * Gemini-Gmail Bridge - Main Application
 * Interactive interface for natural language Gmail management through Gemini AI.
 */
declare class GeminiBridge {
    private geminiService;
    private running;
    constructor();
    /**
     * Start the bridge application
     */
    start(): Promise<void>;
    /**
     * Show welcome message
     */
    private showWelcome;
    /**
     * Validate configuration
     */
    private validateConfig;
    /**
     * Initialize Gemini service
     */
    private initializeGemini;
    /**
     * Run the main interactive loop
     */
    private runInteractiveLoop;
    /**
     * Handle special commands
     */
    private handleSpecialCommands;
    /**
     * Process user message with Gemini
     */
    private processWithGemini;
    /**
     * Show help information
     */
    private showHelp;
    /**
     * Show available functions
     */
    private showFunctions;
    /**
     * Show system status
     */
    private showStatus;
}
export { GeminiBridge };
//# sourceMappingURL=index.d.ts.map