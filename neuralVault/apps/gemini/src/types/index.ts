/**
 * Type definitions for Gemini-Gmail Bridge
 */

export interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body?: string;
  attachments?: Attachment[];
  labels?: string[];
}

export interface Attachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface EmailListResult {
  success: boolean;
  count: number;
  emails: Email[];
  message: string;
  error?: string;
}

export interface EmailSearchResult {
  success: boolean;
  count: number;
  emails: Email[];
  query: string;
  message: string;
  error?: string;
}

export interface EmailReadResult {
  success: boolean;
  email?: Email;
  message: string;
  error?: string;
}

export interface EmailSendResult {
  success: boolean;
  to: string;
  subject: string;
  message: string;
  error?: string;
}

export interface LabelsResult {
  success: boolean;
  count: number;
  labels: GmailLabel[];
  message: string;
  error?: string;
}

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface GeminiFunctionResponse {
  name: string;
  response: Record<string, any>;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface MCPConfig {
  serverUrl: string;
  credentialsPath: string;
}

export interface AppConfig {
  gemini: GeminiConfig;
  mcp: MCPConfig;
  debug: boolean;
  logLevel: string;
}

export interface FunctionSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface GmailSearchQuery {
  query: string;
  maxResults?: number;
}

export interface EmailListQuery {
  maxResults?: number;
  label?: string;
}

export interface EmailSendQuery {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface EmailReadQuery {
  emailId: string;
}

export interface UserCommand {
  type: 'natural' | 'function' | 'special';
  content: string;
  functionName?: string;
  arguments?: Record<string, any>;
}

export interface BridgeResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
