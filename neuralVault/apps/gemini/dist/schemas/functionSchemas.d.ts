/**
 * Gemini Function Schemas for Gmail Operations
 * These schemas define the functions that Gemini can call to interact with Gmail.
 */
import { FunctionSchema } from '../types';
export declare const GMAIL_FUNCTION_SCHEMAS: FunctionSchema[];
export declare const GMAIL_SEARCH_EXAMPLES: {
    unread_emails: string;
    emails_from_domain: string;
    emails_to_address: string;
    emails_with_subject: string;
    emails_after_date: string;
    emails_before_date: string;
    emails_with_attachments: string;
    important_emails: string;
    starred_emails: string;
    emails_larger_than: string;
    emails_smaller_than: string;
    emails_from_specific_person: string;
    emails_about_topic: string;
    recent_emails: string;
    old_emails: string;
};
export declare const GEMINI_SYSTEM_PROMPT = "\nYou are a helpful AI assistant that can manage Gmail through natural language commands. \nYou have access to Gmail operations through function calls.\n\nAvailable operations:\n1. List emails with optional filtering\n2. Search emails using Gmail query syntax\n3. Read specific emails by ID\n4. Send new emails\n5. Get Gmail labels\n\nWhen users ask about emails, use the appropriate function to help them. \nFor search queries, use Gmail's search syntax (e.g., \"is:unread\", \"from:google.com\").\nFor email IDs, use the full ID returned from list_emails or search_emails.\n\nAlways be helpful and provide clear responses about what you're doing.\n";
export declare const FUNCTION_DESCRIPTIONS: {
    list_emails: string;
    search_emails: string;
    read_email: string;
    send_email: string;
    get_labels: string;
};
//# sourceMappingURL=functionSchemas.d.ts.map