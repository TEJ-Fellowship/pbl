"use strict";
/**
 * Gemini Function Schemas for Gmail Operations
 * These schemas define the functions that Gemini can call to interact with Gmail.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FUNCTION_DESCRIPTIONS = exports.GEMINI_SYSTEM_PROMPT = exports.GMAIL_SEARCH_EXAMPLES = exports.GMAIL_FUNCTION_SCHEMAS = void 0;
exports.GMAIL_FUNCTION_SCHEMAS = [
    {
        name: "list_emails",
        description: "List emails from Gmail with optional filtering",
        parameters: {
            type: "object",
            properties: {
                maxResults: {
                    type: "integer",
                    description: "Maximum number of emails to return (default: 10, max: 100)",
                    minimum: 1,
                    maximum: 100
                },
                label: {
                    type: "string",
                    description: "Gmail label to filter by (e.g., 'INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'IMPORTANT', 'STARRED')",
                    default: "INBOX"
                }
            },
            required: []
        }
    },
    {
        name: "search_emails",
        description: "Search emails using Gmail search query syntax",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Gmail search query (e.g., 'is:unread', 'from:google.com', 'subject:meeting', 'after:2024/01/01')"
                },
                maxResults: {
                    type: "integer",
                    description: "Maximum number of emails to return (default: 10, max: 100)",
                    minimum: 1,
                    maximum: 100
                }
            },
            required: ["query"]
        }
    },
    {
        name: "read_email",
        description: "Read a specific email by its ID",
        parameters: {
            type: "object",
            properties: {
                emailId: {
                    type: "string",
                    description: "The Gmail message ID of the email to read"
                }
            },
            required: ["emailId"]
        }
    },
    {
        name: "send_email",
        description: "Send a new email",
        parameters: {
            type: "object",
            properties: {
                to: {
                    type: "string",
                    description: "Recipient email address"
                },
                subject: {
                    type: "string",
                    description: "Email subject line"
                },
                body: {
                    type: "string",
                    description: "Email body content"
                },
                cc: {
                    type: "string",
                    description: "CC recipient email address (optional)"
                },
                bcc: {
                    type: "string",
                    description: "BCC recipient email address (optional)"
                }
            },
            required: ["to", "subject", "body"]
        }
    },
    {
        name: "get_labels",
        description: "Get all Gmail labels and folders",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    }
];
// Gmail search query examples for Gemini
exports.GMAIL_SEARCH_EXAMPLES = {
    unread_emails: "is:unread",
    emails_from_domain: "from:google.com",
    emails_to_address: "to:user@example.com",
    emails_with_subject: "subject:meeting",
    emails_after_date: "after:2024/01/01",
    emails_before_date: "before:2024/12/31",
    emails_with_attachments: "has:attachment",
    important_emails: "is:important",
    starred_emails: "is:starred",
    emails_larger_than: "larger:10M",
    emails_smaller_than: "smaller:1M",
    emails_from_specific_person: "from:john@example.com",
    emails_about_topic: "subject:project OR body:project",
    recent_emails: "newer_than:1d",
    old_emails: "older_than:1y"
};
// System prompt for Gemini
exports.GEMINI_SYSTEM_PROMPT = `
You are a helpful AI assistant that can manage Gmail through natural language commands. 
You have access to Gmail operations through function calls.

Available operations:
1. List emails with optional filtering
2. Search emails using Gmail query syntax
3. Read specific emails by ID
4. Send new emails
5. Get Gmail labels

When users ask about emails, use the appropriate function to help them. 
For search queries, use Gmail's search syntax (e.g., "is:unread", "from:google.com").
For email IDs, use the full ID returned from list_emails or search_emails.

Always be helpful and provide clear responses about what you're doing.
`;
// Function descriptions for better Gemini understanding
exports.FUNCTION_DESCRIPTIONS = {
    list_emails: "Use this to show recent emails, emails from a specific folder, or a limited number of emails",
    search_emails: "Use this to find emails matching specific criteria like unread, from specific sender, with attachments, etc.",
    read_email: "Use this to read the full content of a specific email when you have its ID",
    send_email: "Use this to compose and send a new email to one or more recipients",
    get_labels: "Use this to see all available Gmail labels and folders"
};
