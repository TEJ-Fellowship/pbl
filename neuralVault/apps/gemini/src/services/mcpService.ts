/**
 * MCP Service for Gemini Integration
 * Bridges between TypeScript and the Python MCP client operations.
 */

import axios, { AxiosInstance } from 'axios';
import { spawn, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import {
  Email,
  GmailLabel,
  EmailListResult,
  EmailSearchResult,
  EmailReadResult,
  EmailSendResult,
  LabelsResult,
  EmailListQuery,
  GmailSearchQuery,
  EmailSendQuery,
  EmailReadQuery
} from '../types';
import { config } from '../config';

export class MCPService {
  private httpClient: AxiosInstance;
  private pythonPath: string;

  constructor() {
    this.httpClient = axios.create({
      baseURL: config.getMCPConfig().serverUrl,
      timeout: 30000
    });
    
    // Try to find Python executable
    this.pythonPath = this.findPythonPath();
  }

  private findPythonPath(): string {
    // Try common Python paths
    const pythonPaths = ['python', 'python3', 'py'];
    
    for (const pythonPath of pythonPaths) {
      try {
        const result = spawnSync(pythonPath, ['--version'], { stdio: 'pipe' });
        if (result.status === 0) {
          return pythonPath;
        }
      } catch (error) {
        // Continue to next path
      }
    }
    
    throw new Error('Python not found. Please ensure Python is installed and in PATH.');
  }

  /**
   * Execute Python MCP client command
   */
  private async executePythonCommand(command: string, args: string[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const mcpClientPath = path.resolve(__dirname, '../../../mcp-client/gmail_api.py');
      
      if (!fs.existsSync(mcpClientPath)) {
        reject(new Error(`MCP client not found at: ${mcpClientPath}`));
        return;
      }

      const process = spawn(this.pythonPath, [mcpClientPath, command, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(mcpClientPath)
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            // Try to parse JSON response
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            // If not JSON, return the raw output
            resolve({ success: true, data: stdout.trim() });
          }
        } else {
          reject(new Error(`Python command failed (${code}): ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to execute Python command: ${error.message}`));
      });
    });
  }

  /**
   * List emails from Gmail
   */
  public async listEmails(query: EmailListQuery = {}): Promise<EmailListResult> {
    try {
      const { maxResults = 10, label = 'INBOX' } = query;
      
      console.log(`📧 Listing ${maxResults} emails from ${label}...`);
      
      const result = await this.executePythonCommand('list-emails', [
        '--max-results', maxResults.toString(),
        '--label', label
      ]);

      if (result.success && result.emails) {
        return {
          success: true,
          count: result.emails.length,
          emails: result.emails,
          message: `Found ${result.emails.length} emails from ${label}`
        };
      } else {
        return {
          success: false,
          count: 0,
          emails: [],
          message: result.error || 'Failed to list emails'
        };
      }
    } catch (error) {
      return {
        success: false,
        count: 0,
        emails: [],
        message: `Error listing emails: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search emails using Gmail query syntax
   */
  public async searchEmails(query: GmailSearchQuery): Promise<EmailSearchResult> {
    try {
      const { query: searchQuery, maxResults = 10 } = query;
      
      console.log(`🔍 Searching emails with query: '${searchQuery}'...`);
      
      const result = await this.executePythonCommand('search', [
        '--query', searchQuery,
        '--max-results', maxResults.toString()
      ]);

      if (result.success && result.emails) {
        return {
          success: true,
          count: result.emails.length,
          emails: result.emails,
          query: searchQuery,
          message: `Found ${result.emails.length} emails matching '${searchQuery}'`
        };
      } else {
        return {
          success: false,
          count: 0,
          emails: [],
          query: searchQuery,
          message: result.error || 'Failed to search emails'
        };
      }
    } catch (error) {
      return {
        success: false,
        count: 0,
        emails: [],
        query: query.query,
        message: `Error searching emails: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Read a specific email by ID
   */
  public async readEmail(query: EmailReadQuery): Promise<EmailReadResult> {
    try {
      const { emailId } = query;
      
      console.log(`📖 Reading email ${emailId}...`);
      
      const result = await this.executePythonCommand('read', [emailId]);

      if (result.success && result.email) {
        return {
          success: true,
          email: result.email,
          message: `Successfully read email ${emailId}`
        };
      } else {
        return {
          success: false,
          message: result.error || `Email ${emailId} not found or could not be read`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error reading email: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Send a new email
   */
  public async sendEmail(query: EmailSendQuery): Promise<EmailSendResult> {
    try {
      const { to, subject, body, cc, bcc } = query;
      
      console.log(`📤 Sending email to ${to}...`);
      
      const args = ['--to', to, '--subject', subject, '--body', body];
      
      if (cc) {
        args.push('--cc', cc);
      }
      
      if (bcc) {
        args.push('--bcc', bcc);
      }
      
      const result = await this.executePythonCommand('send', args);

      if (result.success) {
        return {
          success: true,
          to,
          subject,
          message: `Email sent successfully to ${to}`
        };
      } else {
        return {
          success: false,
          to,
          subject,
          message: result.error || `Failed to send email to ${to}`
        };
      }
    } catch (error) {
      return {
        success: false,
        to: query.to,
        subject: query.subject,
        message: `Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all Gmail labels
   */
  public async getLabels(): Promise<LabelsResult> {
    try {
      console.log('🏷️ Fetching Gmail labels...');
      
      const result = await this.executePythonCommand('labels');

      if (result.success && result.labels) {
        return {
          success: true,
          count: result.labels.length,
          labels: result.labels,
          message: `Found ${result.labels.length} Gmail labels`
        };
      } else {
        return {
          success: false,
          count: 0,
          labels: [],
          message: result.error || 'No labels found or failed to fetch labels'
        };
      }
    } catch (error) {
      return {
        success: false,
        count: 0,
        labels: [],
        message: `Error getting labels: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if MCP server is available
   */
  public async checkServer(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Format email list for display
   */
  public formatEmailSummary(emails: Email[]): string {
    if (emails.length === 0) {
      return 'No emails found.';
    }

    let summary = `Found ${emails.length} emails:\n\n`;
    
    emails.forEach((email, index) => {
      summary += `${index + 1}. **${email.subject}**\n`;
      summary += `   From: ${email.from}\n`;
      summary += `   Date: ${email.date}\n`;
      summary += `   ID: ${email.id}\n\n`;
    });

    return summary;
  }

  /**
   * Format email details for display
   */
  public formatEmailDetails(email: Email): string {
    if (!email) {
      return 'Email not found.';
    }

    let details = '**Email Details:**\n\n';
    details += `**Subject:** ${email.subject}\n`;
    details += `**From:** ${email.from}\n`;
    details += `**To:** ${email.to}\n`;
    details += `**Date:** ${email.date}\n`;
    details += `**ID:** ${email.id}\n\n`;

    if (email.body) {
      details += `**Body:**\n${email.body}\n\n`;
    }

    if (email.attachments && email.attachments.length > 0) {
      details += `**Attachments:** ${email.attachments.length} files\n`;
    }

    return details;
  }
}

// Export singleton instance
export const mcpService = new MCPService();
