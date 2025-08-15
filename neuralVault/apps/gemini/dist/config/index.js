"use strict";
/**
 * Configuration management for Gemini-Gmail Bridge
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables
dotenv_1.default.config();
class Config {
    config;
    constructor() {
        this.config = this.loadConfig();
    }
    loadConfig() {
        const geminiConfig = {
            apiKey: process.env.GEMINI_API_KEY || '',
            model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
            maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '4096'),
            temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7')
        };
        const mcpConfig = {
            serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:8000',
            credentialsPath: process.env.GMAIL_CREDENTIALS_PATH || '../mcp-server/credentials.json'
        };
        return {
            gemini: geminiConfig,
            mcp: mcpConfig,
            debug: process.env.DEBUG === 'true',
            logLevel: process.env.LOG_LEVEL || 'info'
        };
    }
    getConfig() {
        return this.config;
    }
    getGeminiConfig() {
        return this.config.gemini;
    }
    getMCPConfig() {
        return this.config.mcp;
    }
    isDebug() {
        return this.config.debug;
    }
    getLogLevel() {
        return this.config.logLevel;
    }
    validate() {
        const errors = [];
        // Validate Gemini configuration
        if (!this.config.gemini.apiKey) {
            errors.push('GEMINI_API_KEY is required');
        }
        // Validate MCP configuration
        const credentialsPath = path_1.default.resolve(this.config.mcp.credentialsPath);
        if (!fs_1.default.existsSync(credentialsPath)) {
            errors.push(`Gmail credentials file not found: ${credentialsPath}`);
        }
        if (errors.length > 0) {
            console.error('❌ Configuration validation failed:');
            errors.forEach(error => console.error(`  - ${error}`));
            return false;
        }
        return true;
    }
    printConfig() {
        console.log('🔧 Configuration:');
        console.log(`  Gemini Model: ${this.config.gemini.model}`);
        console.log(`  MCP Server URL: ${this.config.mcp.serverUrl}`);
        console.log(`  Debug Mode: ${this.config.debug}`);
        console.log(`  Log Level: ${this.config.logLevel}`);
        console.log(`  Credentials Path: ${this.config.mcp.credentialsPath}`);
        console.log(`  API Key: ${this.config.gemini.apiKey ? '✅ Set' : '❌ Not Set'}`);
    }
}
// Export singleton instance
exports.config = new Config();
