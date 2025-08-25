/**
 * Configuration management for Gemini-Gmail Bridge
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { AppConfig, GeminiConfig, MCPConfig } from '../types';

// Load environment variables
dotenv.config();

class Config {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    const geminiConfig: GeminiConfig = {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
      maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '4096'),
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7')
    };

    const mcpConfig: MCPConfig = {
      serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:8000',
      credentialsPath: process.env.GMAIL_CREDENTIALS_PATH || '../mcp-server/credentials.json',
      // New OAuth configuration
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/auth/callback'
    };

    return {
      gemini: geminiConfig,
      mcp: mcpConfig,
      debug: process.env.DEBUG === 'true',
      logLevel: process.env.LOG_LEVEL || 'info'
    };
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public getGeminiConfig(): GeminiConfig {
    return this.config.gemini;
  }

  public getMCPConfig(): MCPConfig {
    return this.config.mcp;
  }

  public isDebug(): boolean {
    return this.config.debug;
  }

  public getLogLevel(): string {
    return this.config.logLevel;
  }

  public validate(): boolean {
    const errors: string[] = [];

    // Validate Gemini configuration
    if (!this.config.gemini.apiKey) {
      errors.push('GEMINI_API_KEY is required');
    }

    // Validate MCP configuration - check for either credentials file or OAuth credentials
    const credentialsPath = path.resolve(this.config.mcp.credentialsPath);
    const hasCredentialsFile = fs.existsSync(credentialsPath);
    const hasOAuthCredentials = this.config.mcp.googleClientId && this.config.mcp.googleClientSecret;

    if (!hasCredentialsFile && !hasOAuthCredentials) {
      errors.push('Either Gmail credentials file or OAuth credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) are required');
      errors.push(`Credentials file path: ${credentialsPath}`);
      errors.push('OAuth credentials should be set in environment variables');
    }

    if (errors.length > 0) {
      console.error('❌ Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      return false;
    }

    return true;
  }

  public printConfig(): void {
    console.log('🔧 Configuration:');
    console.log(`  Gemini Model: ${this.config.gemini.model}`);
    console.log(`  MCP Server URL: ${this.config.mcp.serverUrl}`);
    console.log(`  Debug Mode: ${this.config.debug}`);
    console.log(`  Log Level: ${this.config.logLevel}`);
    console.log(`  Credentials Path: ${this.config.mcp.credentialsPath}`);
    console.log(`  API Key: ${this.config.gemini.apiKey ? '✅ Set' : '❌ Not Set'}`);
    
    // Show authentication method
    const credentialsPath = path.resolve(this.config.mcp.credentialsPath);
    const hasCredentialsFile = fs.existsSync(credentialsPath);
    const hasOAuthCredentials = this.config.mcp.googleClientId && this.config.mcp.googleClientSecret;
    
    if (hasCredentialsFile) {
      console.log(`  Authentication: ✅ Credentials file found`);
    } else if (hasOAuthCredentials) {
      console.log(`  Authentication: ✅ OAuth credentials configured`);
    } else {
      console.log(`  Authentication: ❌ No authentication method found`);
    }
  }
}

// Export singleton instance
export const config = new Config();
