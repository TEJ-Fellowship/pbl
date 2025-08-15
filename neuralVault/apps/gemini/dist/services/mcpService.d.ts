/**
 * MCP Service for Gemini Integration
 * Bridges between TypeScript and the Python MCP client operations.
 */
import { Email, EmailListResult, EmailSearchResult, EmailReadResult, EmailSendResult, LabelsResult, EmailListQuery, GmailSearchQuery, EmailSendQuery, EmailReadQuery } from '../types';
export declare class MCPService {
    private httpClient;
    private pythonPath;
    constructor();
    private findPythonPath;
    /**
     * Execute Python MCP client command
     */
    private executePythonCommand;
    /**
     * List emails from Gmail
     */
    listEmails(query?: EmailListQuery): Promise<EmailListResult>;
    /**
     * Search emails using Gmail query syntax
     */
    searchEmails(query: GmailSearchQuery): Promise<EmailSearchResult>;
    /**
     * Read a specific email by ID
     */
    readEmail(query: EmailReadQuery): Promise<EmailReadResult>;
    /**
     * Send a new email
     */
    sendEmail(query: EmailSendQuery): Promise<EmailSendResult>;
    /**
     * Get all Gmail labels
     */
    getLabels(): Promise<LabelsResult>;
    /**
     * Check if MCP server is available
     */
    checkServer(): Promise<boolean>;
    /**
     * Format email list for display
     */
    formatEmailSummary(emails: Email[]): string;
    /**
     * Format email details for display
     */
    formatEmailDetails(email: Email): string;
}
export declare const mcpService: MCPService;
//# sourceMappingURL=mcpService.d.ts.map