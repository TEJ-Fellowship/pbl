#!/usr/bin/env node
"use strict";
/**
 * Gemini-Gmail Bridge - Main Application
 * Interactive interface for natural language Gmail management through Gemini AI.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiBridge = void 0;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const commander_1 = require("commander");
const config_1 = require("./config");
const geminiService_1 = require("./services/geminiService");
const mcpService_1 = require("./services/mcpService");
class GeminiBridge {
    geminiService;
    running = false;
    constructor() {
        this.geminiService = null;
    }
    /**
     * Start the bridge application
     */
    async start() {
        try {
            this.showWelcome();
            // Validate configuration
            if (!this.validateConfig()) {
                return;
            }
            // Initialize Gemini service
            if (!await this.initializeGemini()) {
                return;
            }
            // Start interactive loop
            await this.runInteractiveLoop();
        }
        catch (error) {
            console.error(chalk_1.default.red(`❌ Unexpected error: ${error}`));
        }
    }
    /**
     * Show welcome message
     */
    showWelcome() {
        console.log(chalk_1.default.blue.bold('\n🤖 Gemini-Gmail Bridge'));
        console.log(chalk_1.default.dim('Natural language Gmail management through Gemini AI\n'));
    }
    /**
     * Validate configuration
     */
    validateConfig() {
        const spinner = (0, ora_1.default)('Validating configuration...').start();
        if (!config_1.config.validate()) {
            spinner.fail('Configuration validation failed');
            return false;
        }
        spinner.succeed('Configuration validated');
        config_1.config.printConfig();
        return true;
    }
    /**
     * Initialize Gemini service
     */
    async initializeGemini() {
        const spinner = (0, ora_1.default)('Initializing Gemini service...').start();
        try {
            this.geminiService = await (0, geminiService_1.getGeminiService)();
            spinner.succeed('Gemini service initialized');
            return true;
        }
        catch (error) {
            spinner.fail(`Failed to initialize Gemini service: ${error}`);
            return false;
        }
    }
    /**
     * Run the main interactive loop
     */
    async runInteractiveLoop() {
        this.running = true;
        while (this.running) {
            try {
                const { userInput } = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'userInput',
                        message: chalk_1.default.cyan('You:'),
                        validate: (input) => {
                            if (!input.trim()) {
                                return 'Please enter a message';
                            }
                            return true;
                        }
                    }
                ]);
                // Handle special commands
                if (this.handleSpecialCommands(userInput)) {
                    continue;
                }
                // Process with Gemini
                await this.processWithGemini(userInput);
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('User force closed')) {
                    this.running = false;
                }
                else {
                    console.error(chalk_1.default.red(`❌ Error: ${error}`));
                }
            }
        }
        console.log(chalk_1.default.yellow('\n👋 Goodbye!'));
    }
    /**
     * Handle special commands
     */
    handleSpecialCommands(command) {
        const cmd = command.toLowerCase().trim();
        switch (cmd) {
            case 'quit':
            case 'exit':
            case 'q':
                this.running = false;
                return true;
            case 'help':
            case 'h':
                this.showHelp();
                return true;
            case 'functions':
            case 'f':
                this.showFunctions();
                return true;
            case 'status':
            case 's':
                this.showStatus();
                return true;
            case 'clear':
            case 'c':
                console.clear();
                return true;
            default:
                return false;
        }
    }
    /**
     * Process user message with Gemini
     */
    async processWithGemini(message) {
        const spinner = (0, ora_1.default)('Processing with Gemini...').start();
        try {
            const response = await this.geminiService.processMessage(message);
            spinner.stop();
            if (response.success) {
                console.log(chalk_1.default.green.bold('\n🤖 Gemini:'));
                console.log(chalk_1.default.white(response.message));
                // Display formatted email data if available
                if (response.data?.type === 'function_result') {
                    if (response.data.result?.summary) {
                        console.log(chalk_1.default.cyan('\n📧 Email Summary:'));
                        console.log(chalk_1.default.white(response.data.result.summary));
                    }
                    if (response.data.result?.details) {
                        console.log(chalk_1.default.cyan('\n📖 Email Details:'));
                        console.log(chalk_1.default.white(response.data.result.details));
                    }
                    if (response.data.geminiResponse) {
                        console.log(chalk_1.default.cyan('\n📋 Function Result:'));
                        console.log(chalk_1.default.white(response.data.geminiResponse));
                    }
                }
            }
            else {
                console.log(chalk_1.default.red.bold('\n❌ Error:'));
                console.log(chalk_1.default.white(response.message));
            }
        }
        catch (error) {
            spinner.fail('Failed to process message');
            console.error(chalk_1.default.red(`Error: ${error}`));
        }
    }
    /**
     * Show help information
     */
    showHelp() {
        console.log(chalk_1.default.blue.bold('\n📚 Help - Gemini-Gmail Bridge\n'));
        console.log(chalk_1.default.yellow('Natural Language Commands:'));
        console.log('You can ask me to manage your Gmail using natural language:\n');
        console.log(chalk_1.default.cyan('Email Management:'));
        console.log('- "Show me my recent emails"');
        console.log('- "List 5 emails from my inbox"');
        console.log('- "Show emails from the SENT folder"');
        console.log('- "Display unread emails"\n');
        console.log(chalk_1.default.cyan('Email Search:'));
        console.log('- "Search for emails from Google"');
        console.log('- "Find emails about meetings"');
        console.log('- "Show emails with attachments"');
        console.log('- "Search for important emails from this week"\n');
        console.log(chalk_1.default.cyan('Email Actions:'));
        console.log('- "Read the latest email from John"');
        console.log('- "Send an email to sarah@example.com about the meeting"');
        console.log('- "Compose an email to the team about project updates"\n');
        console.log(chalk_1.default.cyan('Email Analysis:'));
        console.log('- "Summarize my inbox"');
        console.log('- "Show me emails from yesterday"');
        console.log('- "Find emails larger than 10MB"\n');
        console.log(chalk_1.default.yellow('Special Commands:'));
        console.log('- help - Show this help');
        console.log('- functions - Show available functions');
        console.log('- status - Show system status');
        console.log('- clear - Clear the screen');
        console.log('- quit - Exit the application\n');
        console.log(chalk_1.default.yellow('Gmail Search Syntax:'));
        console.log('- is:unread - Unread emails');
        console.log('- from:domain.com - Emails from specific domain');
        console.log('- subject:keyword - Emails with subject containing keyword');
        console.log('- has:attachment - Emails with attachments');
        console.log('- after:2024/01/01 - Emails after specific date');
        console.log('- larger:10M - Emails larger than 10MB\n');
    }
    /**
     * Show available functions
     */
    showFunctions() {
        console.log(chalk_1.default.blue.bold('\n🔧 Available Gmail Functions\n'));
        const functions = this.geminiService.getAvailableFunctions();
        const descriptions = {
            list_emails: 'List emails with optional filtering',
            search_emails: 'Search emails using Gmail query syntax',
            read_email: 'Read a specific email by ID',
            send_email: 'Send a new email',
            get_labels: 'Get all Gmail labels'
        };
        functions.forEach(func => {
            console.log(chalk_1.default.cyan(`• ${func}`));
            console.log(chalk_1.default.dim(`  ${descriptions[func] || 'Unknown function'}\n`));
        });
    }
    /**
     * Show system status
     */
    async showStatus() {
        console.log(chalk_1.default.blue.bold('\n📊 System Status\n'));
        const appConfig = config_1.config.getConfig();
        console.log(chalk_1.default.yellow('Configuration:'));
        console.log(`- Gemini Model: ${appConfig.gemini.model}`);
        console.log(`- MCP Server URL: ${appConfig.mcp.serverUrl}`);
        console.log(`- Debug Mode: ${appConfig.debug}`);
        console.log(`- Log Level: ${appConfig.logLevel}\n`);
        console.log(chalk_1.default.yellow('Services:'));
        console.log(`- Gemini Service: ${this.geminiService ? '✅ Connected' : '❌ Not Connected'}`);
        const serverStatus = await mcpService_1.mcpService.checkServer();
        console.log(`- MCP Server: ${serverStatus ? '✅ Available' : '❌ Not Available'}`);
        const functions = this.geminiService?.getAvailableFunctions() || [];
        console.log(`- Available Functions: ${functions.length}\n`);
    }
}
exports.GeminiBridge = GeminiBridge;
// CLI Commands
const program = new commander_1.Command();
program
    .name('gemini-gmail-bridge')
    .description('Gemini-Gmail Bridge using TypeScript and MCP')
    .version('1.0.0');
program
    .command('start')
    .description('Start the interactive Gemini-Gmail bridge')
    .action(async () => {
    const bridge = new GeminiBridge();
    await bridge.start();
});
program
    .command('test')
    .description('Test the connection to Gemini and MCP services')
    .action(async () => {
    console.log(chalk_1.default.blue.bold('🧪 Testing Gemini-Gmail Bridge\n'));
    // Test configuration
    console.log(chalk_1.default.yellow('Testing configuration...'));
    if (config_1.config.validate()) {
        console.log(chalk_1.default.green('✅ Configuration is valid'));
    }
    else {
        console.log(chalk_1.default.red('❌ Configuration validation failed'));
        return;
    }
    // Test Gemini service
    console.log(chalk_1.default.yellow('\nTesting Gemini service...'));
    try {
        const geminiService = await (0, geminiService_1.getGeminiService)();
        console.log(chalk_1.default.green('✅ Gemini service is working'));
    }
    catch (error) {
        console.log(chalk_1.default.red(`❌ Gemini service failed: ${error}`));
        return;
    }
    // Test MCP service
    console.log(chalk_1.default.yellow('\nTesting MCP service...'));
    try {
        const serverStatus = await mcpService_1.mcpService.checkServer();
        if (serverStatus) {
            console.log(chalk_1.default.green('✅ MCP server is available'));
        }
        else {
            console.log(chalk_1.default.red('❌ MCP server is not available'));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red(`❌ MCP service failed: ${error}`));
    }
    console.log(chalk_1.default.green.bold('\n🎉 All tests completed!'));
});
// Parse command line arguments
if (require.main === module) {
    program.parse();
}
