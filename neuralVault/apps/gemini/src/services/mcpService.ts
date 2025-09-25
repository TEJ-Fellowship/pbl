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
      const mcpClientPath = path.resolve(__dirname, '../../../mcp-client/gmail_wrapper.py');
      
      if (!fs.existsSync(mcpClientPath)) {
        reject(new Error(`MCP client not found at: ${mcpClientPath}`));
        return;
      }

      const pythonProcess = spawn(this.pythonPath, [mcpClientPath, command, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(mcpClientPath),
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Clean up the stdout and try to parse JSON response
            const cleanStdout = stdout.trim();
            const result = JSON.parse(cleanStdout);
            resolve(result);
          } catch (error) {
            // If not JSON, return the raw output
            resolve({ success: true, data: stdout.trim() });
          }
        } else {
          reject(new Error(`Python command failed (${code}): ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
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
        maxResults.toString(),
        label
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
      
      const result = await this.executePythonCommand('search-emails', [
        searchQuery,
        maxResults.toString()
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
      
      const result = await this.executePythonCommand('read-email', [emailId]);

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
      
      const result = await this.executePythonCommand('send-email', args);

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
      
      const result = await this.executePythonCommand('get-labels');

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
   * Mark emails as read or unread
   */
  public async markAsRead(query: { emailIds: string[], read: boolean }): Promise<any> {
    try {
      const { emailIds, read } = query;
      console.log(`📧 Marking ${emailIds.length} email(s) as ${read ? 'read' : 'unread'}...`);
      
      const result = await this.executePythonCommand('mark-as-read', [
        emailIds.join(','),
        read.toString()
      ]);

      if (result.success) {
        return {
          success: true,
          message: `Marked ${emailIds.length} email(s) as ${read ? 'read' : 'unread'}`
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to mark emails'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error marking emails: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Star or unstar emails
   */
  public async starEmails(query: { emailIds: string[], starred: boolean }): Promise<any> {
    try {
      const { emailIds, starred } = query;
      console.log(`⭐ ${starred ? 'Starring' : 'Unstarring'} ${emailIds.length} email(s)...`);
      
      const result = await this.executePythonCommand('star-emails', [
        emailIds.join(','),
        starred.toString()
      ]);

      if (result.success) {
        return {
          success: true,
          message: `${starred ? 'Starred' : 'Unstarred'} ${emailIds.length} email(s)`
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to star/unstar emails'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error starring emails: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Move emails to a specific label
   */
  public async moveToLabel(query: { emailIds: string[], label: string }): Promise<any> {
    try {
      const { emailIds, label } = query;
      console.log(`🏷️ Moving ${emailIds.length} email(s) to label '${label}'...`);
      
      const result = await this.executePythonCommand('move-to-label', [
        emailIds.join(','),
        label
      ]);

      if (result.success) {
        return {
          success: true,
          message: `Moved ${emailIds.length} email(s) to label '${label}'`
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to move emails to label'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error moving emails: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Reply to a specific email
   */
  public async replyToEmail(query: { emailId: string, body: string, includeOriginal?: boolean }): Promise<any> {
    try {
      const { emailId, body, includeOriginal = true } = query;
      console.log(`📧 Replying to email ${emailId}...`);
      
      const result = await this.executePythonCommand('reply-to-email', [
        emailId,
        body,
        includeOriginal.toString()
      ]);

      if (result.success) {
        return {
          success: true,
          message: 'Reply sent successfully'
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to send reply'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error sending reply: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Forward an email
   */
  public async forwardEmail(query: { emailId: string, to: string, message?: string }): Promise<any> {
    try {
      const { emailId, to, message = '' } = query;
      console.log(`📤 Forwarding email ${emailId} to ${to}...`);
      
      const result = await this.executePythonCommand('forward-email', [
        emailId,
        to,
        message
      ]);

      if (result.success) {
        return {
          success: true,
          message: 'Email forwarded successfully'
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to forward email'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error forwarding email: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get attachments for an email
   */
  public async getAttachments(query: { emailId: string }): Promise<any> {
    try {
      const { emailId } = query;
      console.log(`📎 Getting attachments for email ${emailId}...`);
      
      const result = await this.executePythonCommand('get-attachments', [emailId]);

      if (result.success && result.attachments) {
        return {
          success: true,
          count: result.attachments.length,
          attachments: result.attachments,
          message: `Found ${result.attachments.length} attachment(s)`
        };
      } else {
        return {
          success: false,
          count: 0,
          attachments: [],
          message: result.error || 'No attachments found or failed to fetch attachments'
        };
      }
    } catch (error) {
      return {
        success: false,
        count: 0,
        attachments: [],
        message: `Error getting attachments: ${error instanceof Error ? error.message : 'Unknown error'}`
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
