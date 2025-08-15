#!/usr/bin/env node
/**
 * Gemini-Gmail Bridge - Main Application
 * Interactive interface for natural language Gmail management through Gemini AI.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { Command } from 'commander';
import { config } from './config';
import { getGeminiService } from './services/geminiService';
import { mcpService } from './services/mcpService';

class GeminiBridge {
  private geminiService: any;
  private running: boolean = false;

  constructor() {
    this.geminiService = null;
  }

  /**
   * Start the bridge application
   */
  public async start(): Promise<void> {
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

    } catch (error) {
      console.error(chalk.red(`❌ Unexpected error: ${error}`));
    }
  }

  /**
   * Show welcome message
   */
  private showWelcome(): void {
    console.log(chalk.blue.bold('\n🤖 Gemini-Gmail Bridge'));
    console.log(chalk.dim('Natural language Gmail management through Gemini AI\n'));
  }

  /**
   * Validate configuration
   */
  private validateConfig(): boolean {
    const spinner = ora('Validating configuration...').start();

    if (!config.validate()) {
      spinner.fail('Configuration validation failed');
      return false;
    }

    spinner.succeed('Configuration validated');
    config.printConfig();
    return true;
  }

  /**
   * Initialize Gemini service
   */
  private async initializeGemini(): Promise<boolean> {
    const spinner = ora('Initializing Gemini service...').start();

    try {
      this.geminiService = await getGeminiService();
      spinner.succeed('Gemini service initialized');
      return true;
    } catch (error) {
      spinner.fail(`Failed to initialize Gemini service: ${error}`);
      return false;
    }
  }

  /**
   * Run the main interactive loop
   */
  private async runInteractiveLoop(): Promise<void> {
    this.running = true;

    while (this.running) {
      try {
        const { userInput } = await inquirer.prompt([
          {
            type: 'input',
            name: 'userInput',
            message: chalk.cyan('You:'),
            validate: (input: string) => {
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

      } catch (error) {
        if (error instanceof Error && error.message.includes('User force closed')) {
          this.running = false;
        } else {
          console.error(chalk.red(`❌ Error: ${error}`));
        }
      }
    }

    console.log(chalk.yellow('\n👋 Goodbye!'));
  }

  /**
   * Handle special commands
   */
  private handleSpecialCommands(command: string): boolean {
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
  private async processWithGemini(message: string): Promise<void> {
    const spinner = ora('Processing with Gemini...').start();

    try {
      const response = await this.geminiService.processMessage(message);

      spinner.stop();

      if (response.success) {
        console.log(chalk.green.bold('\n🤖 Gemini:'));
        console.log(chalk.white(response.message));
        
        // Display formatted email data if available
        if (response.data?.type === 'function_result') {
          if (response.data.result?.summary) {
            console.log(chalk.cyan('\n📧 Email Summary:'));
            console.log(chalk.white(response.data.result.summary));
          }
          
          if (response.data.result?.details) {
            console.log(chalk.cyan('\n📖 Email Details:'));
            console.log(chalk.white(response.data.result.details));
          }
          
          if (response.data.geminiResponse) {
            console.log(chalk.cyan('\n📋 Function Result:'));
            console.log(chalk.white(response.data.geminiResponse));
          }
        }
      } else {
        console.log(chalk.red.bold('\n❌ Error:'));
        console.log(chalk.white(response.message));
      }
    } catch (error) {
      spinner.fail('Failed to process message');
      console.error(chalk.red(`Error: ${error}`));
    }
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(chalk.blue.bold('\n📚 Help - Gemini-Gmail Bridge\n'));
    
    console.log(chalk.yellow('Natural Language Commands:'));
    console.log('You can ask me to manage your Gmail using natural language:\n');
    
    console.log(chalk.cyan('Email Management:'));
    console.log('- "Show me my recent emails"');
    console.log('- "List 5 emails from my inbox"');
    console.log('- "Show emails from the SENT folder"');
    console.log('- "Display unread emails"\n');
    
    console.log(chalk.cyan('Email Search:'));
    console.log('- "Search for emails from Google"');
    console.log('- "Find emails about meetings"');
    console.log('- "Show emails with attachments"');
    console.log('- "Search for important emails from this week"\n');
    
    console.log(chalk.cyan('Email Actions:'));
    console.log('- "Read the latest email from John"');
    console.log('- "Send an email to sarah@example.com about the meeting"');
    console.log('- "Compose an email to the team about project updates"\n');
    
    console.log(chalk.cyan('Email Analysis:'));
    console.log('- "Summarize my inbox"');
    console.log('- "Show me emails from yesterday"');
    console.log('- "Find emails larger than 10MB"\n');
    
    console.log(chalk.yellow('Special Commands:'));
    console.log('- help - Show this help');
    console.log('- functions - Show available functions');
    console.log('- status - Show system status');
    console.log('- clear - Clear the screen');
    console.log('- quit - Exit the application\n');
    
    console.log(chalk.yellow('Gmail Search Syntax:'));
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
  private showFunctions(): void {
    console.log(chalk.blue.bold('\n🔧 Available Gmail Functions\n'));
    
    const functions = this.geminiService.getAvailableFunctions();
    const descriptions = {
      list_emails: 'List emails with optional filtering',
      search_emails: 'Search emails using Gmail query syntax',
      read_email: 'Read a specific email by ID',
      send_email: 'Send a new email',
      get_labels: 'Get all Gmail labels'
    };

    functions.forEach(func => {
      console.log(chalk.cyan(`• ${func}`));
      console.log(chalk.dim(`  ${descriptions[func as keyof typeof descriptions] || 'Unknown function'}\n`));
    });
  }

  /**
   * Show system status
   */
  private async showStatus(): Promise<void> {
    console.log(chalk.blue.bold('\n📊 System Status\n'));
    
    const appConfig = config.getConfig();
    console.log(chalk.yellow('Configuration:'));
    console.log(`- Gemini Model: ${appConfig.gemini.model}`);
    console.log(`- MCP Server URL: ${appConfig.mcp.serverUrl}`);
    console.log(`- Debug Mode: ${appConfig.debug}`);
    console.log(`- Log Level: ${appConfig.logLevel}\n`);
    
    console.log(chalk.yellow('Services:'));
    console.log(`- Gemini Service: ${this.geminiService ? '✅ Connected' : '❌ Not Connected'}`);
    
    const serverStatus = await mcpService.checkServer();
    console.log(`- MCP Server: ${serverStatus ? '✅ Available' : '❌ Not Available'}`);
    
    const functions = this.geminiService?.getAvailableFunctions() || [];
    console.log(`- Available Functions: ${functions.length}\n`);
  }
}

// CLI Commands
const program = new Command();

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
    console.log(chalk.blue.bold('🧪 Testing Gemini-Gmail Bridge\n'));
    
    // Test configuration
    console.log(chalk.yellow('Testing configuration...'));
    if (config.validate()) {
      console.log(chalk.green('✅ Configuration is valid'));
    } else {
      console.log(chalk.red('❌ Configuration validation failed'));
      return;
    }
    
    // Test Gemini service
    console.log(chalk.yellow('\nTesting Gemini service...'));
    try {
      const geminiService = await getGeminiService();
      console.log(chalk.green('✅ Gemini service is working'));
    } catch (error) {
      console.log(chalk.red(`❌ Gemini service failed: ${error}`));
      return;
    }
    
    // Test MCP service
    console.log(chalk.yellow('\nTesting MCP service...'));
    try {
      const serverStatus = await mcpService.checkServer();
      if (serverStatus) {
        console.log(chalk.green('✅ MCP server is available'));
      } else {
        console.log(chalk.red('❌ MCP server is not available'));
      }
    } catch (error) {
      console.log(chalk.red(`❌ MCP service failed: ${error}`));
    }
    
    console.log(chalk.green.bold('\n🎉 All tests completed!'));
  });

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

export { GeminiBridge };
