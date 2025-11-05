import pool from "../config/database.js";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config.js";

/**
 * PostgreSQL Memory Service
 * Handles long-term conversation memory persistence and retrieval
 * Implements conversation history, Q&A pairs, and semantic search
 */
class PostgreSQLMemoryService {
  constructor() {
    this.pool = pool;
    this.geminiClient = null;
    this.initializeGemini();
  }

  /**
   * Initialize Gemini client for AI-powered personal information extraction
   */
  initializeGemini() {
    try {
      if (!config.GEMINI_API_KEY) {
        console.warn(
          "⚠️ GEMINI_API_KEY not found, using regex-based extraction as fallback"
        );
        return;
      }
      this.geminiClient = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      console.log(
        "✅ PostgreSQLMemoryService: Gemini AI initialized for info extraction"
      );
    } catch (error) {
      console.warn(
        "⚠️ Failed to initialize Gemini client for info extraction:",
        error.message
      );
    }
  }

  /**
   * Extract personal information from text using Gemini AI
   * @param {string} text - The text to extract information from
   * @returns {Promise<Object|null>} - {infoType, infoValue} or null if not found
   */
  async extractPersonalInfoWithGemini(text) {
    if (!this.geminiClient) {
      return null; // Fallback to regex patterns
    }

    try {
      const prompt = `You are an expert at extracting personal information from user messages.

Analyze the following text and extract any personal information the user shares, even if they don't explicitly say "remember".

TEXT: "${text}"

INSTRUCTIONS:
1) Detect ANY personal information declarations (names, relationships, preferences, contact info), not just "remember" statements.
2) Correct obvious typos when extracting (e.g., "namme" → "name").
3) Map relationships to clear info types, e.g., "brother" → "brother's name", "sister" → "sister's name".
4) Supported patterns include but are not limited to:
   - "my name is John" → infoType: "name", infoValue: "John"
   - "I am John" → infoType: "name", infoValue: "John"
   - "my brother name is Sankar" / "my brother's name is Sankar" → infoType: "brother's name", infoValue: "Sankar"
   - "I am Sankar brother" → infoType: "brother's name", infoValue: "Sankar"
   - "Sankar is my brother" → infoType: "brother's name", infoValue: "Sankar"
   - "my sister is Alice" → infoType: "sister's name", infoValue: "Alice"
   - "my dog's name is Max" → infoType: "dog's name", infoValue: "Max"
   - "my favorite color is blue" → infoType: "favorite color", infoValue: "blue"
   - "my email is john@example.com" → infoType: "email", infoValue: "john@example.com"
5) If the text is a question or does not explicitly provide a value, set hasInfo=false. Do NOT invent placeholders like "unknown", "n/a", or "not provided".

RESPONSE FORMAT (JSON only, no extra text):
{
  "hasInfo": true|false,
  "infoType": "string or null",
  "infoValue": "string or null"
}`;

      const model = this.geminiClient.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text().trim();

      // Extract JSON from response (handle markdown code blocks if present)
      let jsonText = textResponse;
      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      } else {
        // Try to find JSON object directly
        const directJsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (directJsonMatch) {
          jsonText = directJsonMatch[0];
        }
      }

      // Parse and validate JSON
      const extracted = JSON.parse(jsonText);

      if (extracted && extracted.hasInfo === true) {
        const infoType =
          typeof extracted.infoType === "string"
            ? extracted.infoType.trim()
            : "";
        const infoValue =
          typeof extracted.infoValue === "string"
            ? extracted.infoValue.trim()
            : "";

        // Reject empty or placeholder values
        const placeholderRegex =
          /^(unknown|not provided|n\/a|null|none|undefined)$/i;
        const commonFalsePositives = [
          "an expert",
          "sorry",
          "the",
          "a",
          "this",
          "that",
          "there",
          "here",
        ];

        const valueLower = infoValue.toLowerCase();
        const isPlaceholder = placeholderRegex.test(infoValue);
        const hitsFalsePositive = commonFalsePositives.some((fp) =>
          valueLower.includes(fp)
        );

        if (
          infoType &&
          infoValue &&
          !isPlaceholder &&
          !hitsFalsePositive &&
          infoValue.length > 1 &&
          infoValue.length < 100
        ) {
          return {
            infoType,
            infoValue,
          };
        }
      }

      return null;
    } catch (error) {
      console.warn("⚠️ Gemini personal info extraction failed:", error.message);
      return null; // Fallback to regex patterns
    }
  }

  /**
   * Create or get existing conversation session
   */
  async createOrGetSession(sessionId, userId = null, metadata = {}) {
    const client = await this.pool.connect();

    try {
      // Check if session exists
      const existingSession = await client.query(
        "SELECT * FROM conversation_sessions WHERE session_id = $1",
        [sessionId]
      );

      if (existingSession.rows.length > 0) {
        // Update last activity
        await client.query(
          "UPDATE conversation_sessions SET updated_at = NOW() WHERE session_id = $1",
          [sessionId]
        );
        return existingSession.rows[0];
      }

      // Create new session
      const newSession = await client.query(
        `INSERT INTO conversation_sessions (session_id, user_id, metadata) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [sessionId, userId, JSON.stringify(metadata)]
      );

      console.log(`🆕 Created new conversation session: ${sessionId}`);
      return newSession.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Store a conversation message
   */
  async storeMessage(sessionId, role, content, metadata = {}) {
    const client = await this.pool.connect();

    try {
      const messageId = uuidv4();

      // Calculate token count for the message
      let tokenCount;
      try {
        // Try to use the database function first
        const tokenResult = await client.query(
          `SELECT estimate_token_count($1) as token_count`,
          [content]
        );
        tokenCount = tokenResult.rows[0].token_count;
      } catch (error) {
        // Fallback to JavaScript-based token estimation if database function doesn't exist
        console.log(
          "⚠️ Database function estimate_token_count not found, using fallback method"
        );
        tokenCount = this.estimateTokenCount(content);
      }

      // Try to insert with token_count, fallback to without it if column doesn't exist
      let result;
      try {
        result = await client.query(
          `INSERT INTO conversation_messages (message_id, session_id, role, content, metadata, token_count)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            messageId,
            sessionId,
            role,
            content,
            JSON.stringify(metadata),
            tokenCount,
          ]
        );
      } catch (error) {
        if (error.message.includes("token_count")) {
          console.log(
            "⚠️ token_count column doesn't exist, inserting without it"
          );
          result = await client.query(
            `INSERT INTO conversation_messages (message_id, session_id, role, content, metadata)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [messageId, sessionId, role, content, JSON.stringify(metadata)]
          );
        } else {
          throw error;
        }
      }

      // Update session token usage
      try {
        await client.query(`SELECT update_session_token_usage($1)`, [
          sessionId,
        ]);
      } catch (error) {
        console.log(
          "⚠️ Database function update_session_token_usage not found, skipping token usage update"
        );
      }

      console.log(
        `💾 Stored ${role} message for session: ${sessionId} (${tokenCount} tokens)`
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Fallback token counting method
   * Rough estimation: 1 token ≈ 4 characters for English text
   */
  estimateTokenCount(text) {
    if (!text || typeof text !== "string") {
      return 1;
    }
    return Math.max(1, Math.ceil(text.length / 4.0));
  }

  /**
   * Get recent messages for a session (BufferWindowMemory simulation)
   */
  async getRecentMessages(sessionId, limit = 8) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT message_id, role, content, created_at, metadata
         FROM conversation_messages 
         WHERE session_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [sessionId, limit]
      );

      return result.rows.reverse(); // Return in chronological order
    } finally {
      client.release();
    }
  }

  /**
   * Store Q&A pair for long-term memory
   */
  async storeQAPair(
    sessionId,
    question,
    answer,
    context = "",
    relevanceScore = 0.5,
    isImportant = false,
    tags = []
  ) {
    const client = await this.pool.connect();

    try {
      const qaId = uuidv4();
      const result = await client.query(
        `INSERT INTO conversation_qa_pairs 
         (qa_id, session_id, question, answer, context, relevance_score, is_important, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          qaId,
          sessionId,
          question,
          answer,
          context,
          relevanceScore,
          isImportant,
          tags,
        ]
      );

      console.log(`🧠 Stored Q&A pair for long-term memory: ${qaId}`);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve relevant Q&A pairs for a query - IMPROVED VERSION
   * Enhanced with automatic conversation query detection, fuzzy matching, and direct message search
   */
  async getRelevantQAPairs(
    query,
    sessionId = null,
    limit = 5,
    isConversationQueryFlag = null
  ) {
    const client = await this.pool.connect();

    try {
      const queryLower = query.toLowerCase().trim();

      // Detect conversation/personal queries automatically (use classifier flag when provided)
      const conversationKeywords = [
        "my name",
        "name",
        "remember",
        "mentioned",
        "told",
        "said",
        "what did",
        "what was",
        "who am",
        "tell me",
        "what is my",
        "what was my",
        "you told",
        "you said",
        "earlier",
        "before",
        "previously",
        "did i",
        "did you",
        "have i",
      ];
      const isConversationQuery =
        typeof isConversationQueryFlag === "boolean"
          ? isConversationQueryFlag
          : conversationKeywords.some((keyword) =>
              queryLower.includes(keyword)
            );

      console.log(
        `📊 Query type: ${
          isConversationQuery ? "Conversation/Personal" : "Technical"
        }`
      );
      console.log(`📊 Session ID: ${sessionId || "None"}`);

      // Debug: Check if we have any Q&A pairs for this session
      if (sessionId) {
        const qaCountResult = await client.query(
          `SELECT COUNT(*) as count FROM conversation_qa_pairs WHERE session_id = $1`,
          [sessionId]
        );
        console.log(
          `📊 Total Q&A pairs in database for session ${sessionId}: ${qaCountResult.rows[0].count}`
        );
      }

      let results = [];

      // Strategy 1: For conversation queries, search recent messages directly first
      if (isConversationQuery && sessionId) {
        console.log(
          `\n🔍 Strategy 1: Searching recent conversation messages for session: ${sessionId}...`
        );
        const recentMessages = await client.query(
          `SELECT message_id, role, content, created_at, metadata
           FROM conversation_messages 
           WHERE session_id = $1 
           ORDER BY created_at DESC 
           LIMIT 30`,
          [sessionId]
        );

        console.log(
          `📊 Found ${recentMessages.rows.length} recent messages for session ${sessionId}`
        );

        // Extract information from recent messages using pattern matching
        for (const msg of recentMessages.rows) {
          const content = msg.content;

          // Pattern matching for personal information - generic patterns
          // Order matters: more specific patterns first
          const personalInfoPatterns = [
            // "remember my project partner name is Sanjeev" - specific relationship
            /(?:remember|remember\s+that)\s+my\s+project\s+partner'?s?\s+name\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
            // "remember my name is jangbu" - user's own name
            /(?:remember|remember\s+that)\s+my\s+name\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
            // Generic "remember my [something] is [value]" pattern
            /(?:remember|remember\s+that)\s+my\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+is\s+([A-Za-z]+(?:\s+[A-Za-z\s.,@-]+)?)/i,
            // "my name is Sankar" or "my name is sankar"
            /(?:my\s+name\s+is|name\s+is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*(?:\s+[A-Za-z]+)?)/i,
            // "I am Sankar" or "I am sankar"
            /\b(?:i\s+am|i'm)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
            // "call me Sankar"
            /(?:call\s+me)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
          ];

          // Check if user message contains personal information declarations
          // Process ALL user messages for personal information, not just when query mentions "remember" or "name"
          if (msg.role === "user") {
            let infoFound = false;

            // Try Gemini AI extraction first (more flexible) - works for any personal info statement
            try {
              const geminiResult = await this.extractPersonalInfoWithGemini(
                content
              );
              if (
                geminiResult &&
                geminiResult.infoType &&
                geminiResult.infoValue
              ) {
                // Generate appropriate answer format based on info type
                let answer = "";
                if (geminiResult.infoType === "project partner's name") {
                  answer = `Your project partner's name is ${geminiResult.infoValue}`;
                } else if (geminiResult.infoType === "name") {
                  answer = `Your name is ${geminiResult.infoValue}`;
                } else {
                  // Generic format: preserve the original structure
                  answer = `Your ${geminiResult.infoType} is ${geminiResult.infoValue}`;
                }

                results.push({
                  qa_id: `synthetic_${msg.message_id}_gemini`,
                  question: query,
                  answer: answer,
                  context: `Found in conversation: "${content.substring(
                    0,
                    200
                  )}"`,
                  relevance_score: 0.95,
                  session_id: sessionId,
                  created_at: msg.created_at,
                  source: "recent_message",
                });

                console.log(
                  `✅ [Gemini] Found personal information in recent messages: ${geminiResult.infoType} = ${geminiResult.infoValue}`
                );
                infoFound = true;
              }
            } catch (error) {
              console.warn(
                "⚠️ Gemini extraction failed, falling back to regex:",
                error.message
              );
            }

            // Fallback to regex patterns if Gemini didn't find anything
            if (!infoFound) {
              // Try each pattern in order (most specific first)
              for (let i = 0; i < personalInfoPatterns.length; i++) {
                const pattern = personalInfoPatterns[i];
                const match = content.match(pattern);

                if (match) {
                  let infoType = null;
                  let infoValue = null;

                  // Handle different pattern types
                  if (i === 0) {
                    // Project partner name pattern
                    infoType = "project partner's name";
                    infoValue = match[1].trim();
                  } else if (i === 1) {
                    // User's own name pattern
                    infoType = "name";
                    infoValue = match[1].trim();
                  } else if (i === 2) {
                    // Generic "remember my [something] is [value]" pattern
                    infoType = match[1].trim(); // e.g., "dog's name", "favorite color"
                    infoValue = match[2].trim(); // e.g., "Max", "blue"
                  } else {
                    // Other name patterns (i == 3, 4, 5)
                    infoType = "name";
                    infoValue = match[1].trim();
                  }

                  // Filter out false positives
                  const falsePositives = [
                    "an expert",
                    "sorry",
                    "the",
                    "a",
                    "this",
                    "that",
                    "there",
                    "here",
                  ];

                  if (
                    infoValue &&
                    !falsePositives.some((fp) =>
                      infoValue.toLowerCase().includes(fp.toLowerCase())
                    ) &&
                    infoValue.length > 1 &&
                    infoValue.length < 100
                  ) {
                    // Generate appropriate answer format based on info type
                    let answer = "";
                    if (infoType === "project partner's name") {
                      answer = `Your project partner's name is ${infoValue}`;
                    } else if (infoType === "name") {
                      answer = `Your name is ${infoValue}`;
                    } else {
                      // Generic format: preserve the original structure
                      answer = `Your ${infoType} is ${infoValue}`;
                    }

                    results.push({
                      qa_id: `synthetic_${msg.message_id}_${i}`,
                      question: query,
                      answer: answer,
                      context: `Found in conversation: "${content.substring(
                        0,
                        200
                      )}"`,
                      relevance_score: 0.95,
                      session_id: sessionId,
                      created_at: msg.created_at,
                      source: "recent_message",
                    });

                    console.log(
                      `✅ [Regex] Found personal information in recent messages: ${infoType} = ${infoValue}`
                    );
                    infoFound = true;
                    break; // Stop after first match
                  }
                }
              }
            }
          }

          // Check for other personal information or answers in assistant responses
          if (msg.role === "assistant" && results.length === 0) {
            // Try to find relevant assistant responses
            const queryWords = queryLower
              .split(/\s+/)
              .filter((w) => w.length > 3);
            const contentLower = content.toLowerCase();
            const matchCount = queryWords.filter((word) =>
              contentLower.includes(word)
            ).length;

            if (
              matchCount >= Math.ceil(queryWords.length / 2) &&
              queryWords.length > 0
            ) {
              results.push({
                qa_id: `synthetic_${msg.message_id}`,
                question: query,
                answer: content.substring(0, 500),
                context: `Found in previous assistant response`,
                relevance_score: 0.85,
                session_id: sessionId,
                created_at: msg.created_at,
                source: "recent_message",
              });
              break;
            }
          }
        }

        // If we found results in recent messages, log it
        if (results.length > 0) {
          console.log(
            `✅ Found ${results.length} result(s) in recent messages`
          );
        }
      }

      // Strategy 2: Enhanced database search with fuzzy matching
      if (results.length < limit) {
        console.log(`\n🔍 Strategy 2: Enhanced database search...`);

        // Ensure remainingLimit is an integer (PostgreSQL LIMIT requires bigint)
        const remainingLimit = Math.max(
          1,
          parseInt(limit - results.length, 10)
        );

        // Extract key terms from query (remove stop words)
        const stopWords = [
          "the",
          "a",
          "an",
          "and",
          "or",
          "but",
          "in",
          "on",
          "at",
          "to",
          "for",
          "of",
          "with",
          "is",
          "are",
          "was",
          "were",
          "what",
          "how",
          "when",
          "where",
          "why",
        ];
        const queryTerms = queryLower
          .split(/\s+/)
          .filter((term) => term.length > 2 && !stopWords.includes(term))
          .slice(0, 5); // Limit to 5 terms

        let whereClause = "";
        let queryParams = [];
        let paramIndex = 1;

        // Build conditions with both full-text search and fuzzy matching
        const conditions = [];

        // For conversational queries, use broader matching
        if (isConversationQuery) {
          // For conversational queries, search more broadly
          // Include partial matches and tag-based search
          conditions.push(`(
            question ILIKE $${paramIndex}
            OR answer ILIKE $${paramIndex}
            OR context ILIKE $${paramIndex}
            OR tags && ARRAY['conversation', 'personal', 'memory', 'name']
          )`);
          queryParams.push(`%${queryLower}%`);
          paramIndex++;

          // Also try full-text search
          conditions.push(`(
            to_tsvector('english', question) @@ plainto_tsquery('english', $${paramIndex})
            OR to_tsvector('english', answer) @@ plainto_tsquery('english', $${paramIndex})
          )`);
          queryParams.push(query);
          paramIndex++;
        } else {
          // Full-text search (primary) for technical queries
          conditions.push(`(
            to_tsvector('english', question) @@ plainto_tsquery('english', $${paramIndex})
            OR to_tsvector('english', answer) @@ plainto_tsquery('english', $${paramIndex})
            OR to_tsvector('english', context) @@ plainto_tsquery('english', $${paramIndex})
          )`);
          queryParams.push(query);
          paramIndex++;
        }

        // Fuzzy matching for each key term (for better matching)
        if (queryTerms.length > 0) {
          for (const term of queryTerms) {
            conditions.push(`(
              question ILIKE $${paramIndex}
              OR answer ILIKE $${paramIndex}
              OR context ILIKE $${paramIndex}
            )`);
            queryParams.push(`%${term}%`);
            paramIndex++;
          }
        }

        whereClause = `(${conditions.join(" OR ")})`;

        // Add session filter - IMPORTANT for conversational queries
        if (sessionId) {
          whereClause += ` AND session_id = $${paramIndex}`;
          queryParams.push(sessionId);
          paramIndex++;
        }

        // Add the LIKE pattern parameter for ORDER BY CASE clause
        queryParams.push(`%${queryLower}%`);
        const orderByParamIndex = paramIndex;
        paramIndex++;

        // Add LIMIT parameter (must be integer, not string)
        const limitParamIndex = paramIndex;
        queryParams.push(remainingLimit);

        // Build ORDER BY clause with relevance scoring
        // For conversational queries, prioritize recent Q&A pairs
        const orderByClause = isConversationQuery
          ? `ORDER BY 
              CASE 
                WHEN question ILIKE $${orderByParamIndex} THEN 1
                WHEN answer ILIKE $${orderByParamIndex} THEN 2
                WHEN context ILIKE $${orderByParamIndex} THEN 3
                ELSE 4
              END,
              relevance_score DESC,
              created_at DESC`
          : `ORDER BY 
              relevance_score DESC,
              CASE 
                WHEN question ILIKE $${orderByParamIndex} THEN 1
                WHEN answer ILIKE $${orderByParamIndex} THEN 2
                WHEN context ILIKE $${orderByParamIndex} THEN 3
                ELSE 4
              END,
              ts_rank(to_tsvector('english', question), plainto_tsquery('english', $1)) DESC,
              created_at DESC`;

        const dbResults = await client.query(
          `SELECT qa_id, question, answer, context, relevance_score, session_id, created_at
           FROM conversation_qa_pairs 
           WHERE ${whereClause}
           ${orderByClause}
           LIMIT $${limitParamIndex}`,
          queryParams
        );

        console.log(
          `📊 Database search returned ${dbResults.rows.length} Q&A pairs`
        );

        // Merge results, avoiding duplicates
        const existingIds = new Set(results.map((r) => r.qa_id));
        for (const row of dbResults.rows) {
          if (!existingIds.has(row.qa_id)) {
            results.push({ ...row, source: "qa_pairs" });
            existingIds.add(row.qa_id);
          }
        }
      }

      // Strategy 3: If still no results for conversation query, try broader recent message search
      // But only if Strategy 1 didn't find anything (results.length === 0)
      if (results.length === 0 && isConversationQuery && sessionId) {
        console.log(`🔍 Strategy 3: Broader search in recent messages...`);

        const recentMessages = await client.query(
          `SELECT message_id, role, content, created_at
           FROM conversation_messages 
           WHERE session_id = $1 
           ORDER BY created_at DESC 
           LIMIT 20`,
          [sessionId]
        );

        // Look for any mention of personal information with better extraction
        for (const msg of recentMessages.rows) {
          if (msg.role === "user") {
            const content = msg.content;
            const contentLower = content.toLowerCase();

            // Check if this message contains any personal information
            // Process ALL user messages for personal information automatically
            // Try Gemini AI extraction first (more flexible)
            try {
              const geminiResult = await this.extractPersonalInfoWithGemini(
                content
              );
              if (
                geminiResult &&
                geminiResult.infoType &&
                geminiResult.infoValue
              ) {
                // Generate appropriate answer format
                let answer = "";
                if (geminiResult.infoType === "project partner's name") {
                  answer = `Your project partner's name is ${geminiResult.infoValue}`;
                } else if (geminiResult.infoType === "name") {
                  answer = `Your name is ${geminiResult.infoValue}`;
                } else {
                  // Generic format: preserve the original structure
                  answer = `Your ${geminiResult.infoType} is ${geminiResult.infoValue}`;
                }

                results.push({
                  qa_id: `synthetic_${msg.message_id}_gemini`,
                  question: query,
                  answer: answer,
                  context: `Found in conversation: "${content.substring(
                    0,
                    200
                  )}"`,
                  relevance_score: 0.9,
                  session_id: sessionId,
                  created_at: msg.created_at,
                  source: "recent_message_broad",
                });
                console.log(
                  `✅ [Gemini] Extracted personal information from broader search: ${geminiResult.infoType} = ${geminiResult.infoValue}`
                );
                break;
              }
            } catch (error) {
              console.warn(
                "⚠️ Gemini extraction failed in broader search, falling back to regex:",
                error.message
              );
            }

            // Fallback to regex patterns
            const personalInfoPatterns = [
              // "remember my project partner name is Sanjeev"
              /(?:remember|remember\s+that)\s+my\s+project\s+partner'?s?\s+name\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
              // "remember my name is jangbu"
              /(?:remember|remember\s+that)\s+my\s+name\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
              // Generic "remember my [something] is [value]" pattern
              /(?:remember|remember\s+that)\s+my\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+is\s+([A-Za-z]+(?:\s+[A-Za-z\s.,@-]+)?)/i,
              // "my name is Sankar"
              /(?:my\s+name\s+is|name\s+is|i\s+am|i'm|call\s+me)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
            ];

            let extractedInfo = null;
            let infoType = null;

            for (let i = 0; i < personalInfoPatterns.length; i++) {
              const pattern = personalInfoPatterns[i];
              const match = content.match(pattern);

              if (match) {
                if (i === 0) {
                  // Project partner name
                  infoType = "project partner's name";
                  extractedInfo = match[1].trim();
                } else if (i === 1) {
                  // User's own name
                  infoType = "name";
                  extractedInfo = match[1].trim();
                } else if (i === 2) {
                  // Generic personal info
                  infoType = match[1].trim();
                  extractedInfo = match[2].trim();
                } else {
                  // Other name patterns
                  infoType = "name";
                  extractedInfo = match[1].trim();
                }

                // Filter out false positives
                const falsePositives = [
                  "an expert",
                  "sorry",
                  "the",
                  "a",
                  "this",
                  "that",
                ];

                if (
                  extractedInfo &&
                  !falsePositives.some((fp) =>
                    extractedInfo.toLowerCase().includes(fp.toLowerCase())
                  ) &&
                  extractedInfo.length > 1 &&
                  extractedInfo.length < 100
                ) {
                  break;
                } else {
                  extractedInfo = null;
                  infoType = null;
                }
              }
            }

            // Create a proper Q&A pair with extracted information
            if (extractedInfo && infoType) {
              // Generate appropriate answer format
              let answer = "";
              if (infoType === "project partner's name") {
                answer = `Your project partner's name is ${extractedInfo}`;
              } else if (infoType === "name") {
                answer = `Your name is ${extractedInfo}`;
              } else {
                // Generic format: preserve the original structure
                answer = `Your ${infoType} is ${extractedInfo}`;
              }

              results.push({
                qa_id: `synthetic_${msg.message_id}`,
                question: query,
                answer: answer,
                context: `Found in conversation: "${content.substring(
                  0,
                  200
                )}"`,
                relevance_score: 0.9,
                session_id: sessionId,
                created_at: msg.created_at,
                source: "recent_message_broad",
              });
              console.log(
                `✅ [Regex] Extracted personal information from broader search: ${infoType} = ${extractedInfo}`
              );
              break;
            }
          }
        }
      }

      // Limit results
      const finalResults = results.slice(0, limit);

      console.log(
        `🔍 Found ${finalResults.length} relevant Q&A pairs for query`
      );
      if (finalResults.length > 0) {
        const sources = [
          ...new Set(finalResults.map((r) => r.source || "qa_pairs")),
        ];
        console.log(`📋 Sources: ${sources.join(", ")}`);
        // Debug: Log first result details
        console.log(
          `📋 First result: ${JSON.stringify(finalResults[0], null, 2)}`
        );
      } else {
        console.log(
          `⚠️ No Q&A pairs found. This might be normal for new conversations.`
        );
      }

      return finalResults;
    } catch (error) {
      console.error(`❌ Error retrieving Q&A pairs: ${error.message}`);
      console.error(error.stack);
      // Return empty array on error to prevent breaking the flow
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Store conversation summary
   */
  async storeConversationSummary(sessionId, summaryText, keyTopics = []) {
    const client = await this.pool.connect();

    try {
      const summaryId = uuidv4();
      const result = await client.query(
        `INSERT INTO conversation_summaries (summary_id, session_id, summary_text, key_topics)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [summaryId, sessionId, summaryText, keyTopics]
      );

      console.log(`📝 Stored conversation summary for session: ${sessionId}`);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get conversation summary for a session
   */
  async getConversationSummary(sessionId) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT summary_text, key_topics, created_at
         FROM conversation_summaries 
         WHERE session_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [sessionId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId, limit = 50) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT message_id, role, content, created_at, metadata
         FROM conversation_messages 
         WHERE session_id = $1 
         ORDER BY created_at ASC 
         LIMIT $2`,
        [sessionId, limit]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Search conversations by content
   */
  async searchConversations(query, userId = null, limit = 20) {
    const client = await this.pool.connect();

    try {
      let whereClause = `(
        to_tsvector('english', cm.content) @@ plainto_tsquery('english', $1)
      )`;

      let queryParams = [query];
      let paramIndex = 2;

      if (userId) {
        whereClause += ` AND cs.user_id = $${paramIndex}`;
        queryParams.push(userId);
        paramIndex++;
      }

      const result = await client.query(
        `SELECT DISTINCT 
           cs.session_id, 
           cs.user_id, 
           cs.created_at,
           cs.metadata,
           COUNT(cm.message_id) as message_count
         FROM conversation_sessions cs
         JOIN conversation_messages cm ON cs.session_id = cm.session_id
         WHERE ${whereClause}
         GROUP BY cs.session_id, cs.user_id, cs.created_at, cs.metadata
         ORDER BY cs.created_at DESC
         LIMIT $${paramIndex}`,
        [...queryParams, limit]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a session and all its associated data
   */
  async deleteSession(sessionId) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN"); // Start transaction

      console.log(`🗑️ Deleting session: ${sessionId}`);

      // Delete in order to respect foreign key constraints
      const deleteOrder = [
        "memory_retrieval_cache",
        "conversation_summaries",
        "conversation_qa_pairs",
        "conversation_messages",
        "conversation_sessions",
      ];

      for (const table of deleteOrder) {
        const result = await client.query(
          `DELETE FROM ${table} WHERE session_id = $1`,
          [sessionId]
        );
        console.log(`   ✅ Deleted ${result.rowCount} rows from ${table}`);
      }

      await client.query("COMMIT"); // Commit transaction
      console.log(`✅ Session ${sessionId} deleted successfully`);

      return {
        sessionId,
        deleted: true,
        message: "Session and all associated data deleted successfully",
      };
    } catch (error) {
      await client.query("ROLLBACK"); // Rollback on error
      console.error("❌ Failed to delete session:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get session token usage information
   */
  async getSessionTokenUsage(sessionId) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT 
           session_id,
           total_tokens,
           max_tokens,
           token_usage_percentage,
           created_at,
           updated_at
         FROM conversation_sessions 
         WHERE session_id = $1`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Update session token limit
   */
  async updateSessionTokenLimit(sessionId, maxTokens) {
    const client = await this.pool.connect();

    try {
      await client.query(
        `UPDATE conversation_sessions 
         SET max_tokens = $2, updated_at = NOW()
         WHERE session_id = $1`,
        [sessionId, maxTokens]
      );

      // Recalculate token usage with new limit
      try {
        await client.query(`SELECT update_session_token_usage($1)`, [
          sessionId,
        ]);
      } catch (error) {
        console.log(
          "⚠️ Database function update_session_token_usage not found, skipping token usage update"
        );
      }

      console.log(
        `📊 Updated token limit for session ${sessionId}: ${maxTokens}`
      );
    } finally {
      client.release();
    }
  }

  /**
   * Update session token usage based on stored messages
   */
  async updateSessionTokenUsage(sessionId) {
    const client = await this.pool.connect();

    try {
      // Use the database function to update token usage
      await client.query(`SELECT update_session_token_usage($1)`, [sessionId]);

      console.log(`📊 Updated token usage for session ${sessionId}`);
    } catch (error) {
      console.error("❌ Failed to update session token usage:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get sessions approaching token limit
   */
  async getSessionsNearTokenLimit(threshold = 80) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM get_sessions_near_token_limit($1)`,
        [threshold]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT 
           COUNT(cm.message_id) as total_messages,
           COUNT(CASE WHEN cm.role = 'user' THEN 1 END) as user_messages,
           COUNT(CASE WHEN cm.role = 'assistant' THEN 1 END) as assistant_messages,
           COUNT(qa.qa_id) as qa_pairs,
           COUNT(s.summary_id) as summaries
         FROM conversation_sessions cs
         LEFT JOIN conversation_messages cm ON cs.session_id = cm.session_id
         LEFT JOIN conversation_qa_pairs qa ON cs.session_id = qa.session_id
         LEFT JOIN conversation_summaries s ON cs.session_id = s.session_id
         WHERE cs.session_id = $1`,
        [sessionId]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Clean up old conversations (optional maintenance)
   */
  async cleanupOldConversations(daysOld = 30) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `DELETE FROM conversation_sessions 
         WHERE updated_at < NOW() - INTERVAL '${daysOld} days' 
         AND is_active = false`
      );

      console.log(`🧹 Cleaned up ${result.rowCount} old conversations`);
      return result.rowCount;
    } finally {
      client.release();
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats() {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT 
           (SELECT COUNT(*) FROM conversation_sessions) as total_sessions,
           (SELECT COUNT(*) FROM conversation_messages) as total_messages,
           (SELECT COUNT(*) FROM conversation_qa_pairs) as total_qa_pairs,
           (SELECT COUNT(*) FROM conversation_summaries) as total_summaries,
           (SELECT COUNT(*) FROM conversation_sessions WHERE is_active = true) as active_sessions`
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get database statistics for debugging
   */
  async getDatabaseStats() {
    const client = await this.pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM conversation_sessions) as sessions,
          (SELECT COUNT(*) FROM conversation_messages) as messages,
          (SELECT COUNT(*) FROM conversation_qa_pairs) as qa_pairs,
          (SELECT COUNT(*) FROM conversation_summaries) as summaries,
          (SELECT COUNT(*) FROM memory_retrieval_cache) as cache_entries
      `);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get all sessions for a user
   */
  async getAllSessions(userId, limit = 50, offset = 0) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `
        SELECT 
          cs.session_id,
          cs.user_id,
          cs.metadata,
          cs.created_at,
          cs.updated_at,
          cs.is_active,
          COUNT(cm.message_id) as message_count,
          MAX(cm.created_at) as last_message_time,
          (
            SELECT content 
            FROM conversation_messages 
            WHERE session_id = cs.session_id 
            ORDER BY created_at DESC 
            LIMIT 1
          ) as last_message,
          (
            SELECT content 
            FROM conversation_messages 
            WHERE session_id = cs.session_id 
            AND role = 'user'
            ORDER BY created_at ASC 
            LIMIT 1
          ) as first_user_message,
          (
            SELECT summary_text 
            FROM conversation_summaries 
            WHERE session_id = cs.session_id 
            LIMIT 1
          ) as conversation_summary
        FROM conversation_sessions cs
        LEFT JOIN conversation_messages cm ON cs.session_id = cm.session_id
        WHERE cs.user_id = $1
        GROUP BY cs.session_id, cs.user_id, cs.metadata, cs.created_at, cs.updated_at, cs.is_active
        ORDER BY cs.updated_at DESC
        LIMIT $2 OFFSET $3
      `,
        [userId, limit, offset]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  async close() {
    await this.pool.end();
  }
}

export default PostgreSQLMemoryService;
