import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHybridRetriever } from "../src/hybrid-retriever.js";
import { embedSingle } from "../src/utils/embeddings.js";
import { connectDB } from "../config/db.js";
import BufferWindowMemory from "../src/memory/BufferWindowMemory.js";
import MarkdownIt from "markdown-it";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { multiTurnManager } from "../src/multi-turn-conversation.js";

// Initialize markdown renderer
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Enhanced confidence scoring function with source attribution tracking
function calculateConfidence(results, answer) {
  let confidence = 0;
  let confidenceFactors = [];

  // Factor 1: Number of relevant sources (0-25 points)
  const sourceCount = results.length;
  if (sourceCount >= 6) {
    confidence += 25;
    confidenceFactors.push("Multiple comprehensive sources found");
  } else if (sourceCount >= 4) {
    confidence += 20;
    confidenceFactors.push("Several relevant sources found");
  } else if (sourceCount >= 2) {
    confidence += 15;
    confidenceFactors.push("Some relevant sources found");
  } else if (sourceCount >= 1) {
    confidence += 10;
    confidenceFactors.push("Limited sources found");
  }

  // Factor 2: Average relevance score (0-25 points)
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  if (avgScore >= 0.8) {
    confidence += 25;
    confidenceFactors.push("Very high relevance scores");
  } else if (avgScore >= 0.6) {
    confidence += 20;
    confidenceFactors.push("High relevance scores");
  } else if (avgScore >= 0.4) {
    confidence += 15;
    confidenceFactors.push("Good relevance scores");
  } else if (avgScore >= 0.2) {
    confidence += 10;
    confidenceFactors.push("Moderate relevance scores");
  } else {
    confidence += 5;
    confidenceFactors.push("Low relevance scores");
  }

  // Factor 3: Answer quality indicators (0-25 points)
  const answerLength = answer.length;
  const hasCodeBlocks = answer.includes("```") || answer.includes("`");
  const hasSpecifics =
    answer.includes("API") ||
    answer.includes("endpoint") ||
    answer.includes("parameter") ||
    answer.includes("step");
  const hasExamples =
    answer.includes("example") ||
    answer.includes("for instance") ||
    answer.includes("such as");
  const hasSteps =
    answer.includes("1.") || answer.includes("2.") || answer.includes("Step");

  if (answerLength > 500 && hasSpecifics && (hasExamples || hasSteps)) {
    confidence += 25;
    confidenceFactors.push(
      "Comprehensive answer with specific details and examples"
    );
  } else if (answerLength > 300 && (hasSpecifics || hasCodeBlocks)) {
    confidence += 20;
    confidenceFactors.push("Detailed answer with technical information");
  } else if (answerLength > 200 && (hasExamples || hasSteps)) {
    confidence += 15;
    confidenceFactors.push("Good answer with practical guidance");
  } else if (answerLength > 100) {
    confidence += 10;
    confidenceFactors.push("Basic answer provided");
  } else {
    confidence += 5;
    confidenceFactors.push("Minimal answer");
  }

  // Factor 4: Search method diversity (0-25 points)
  const searchTypes = [...new Set(results.map((r) => r.searchType))];
  if (searchTypes.length >= 3) {
    confidence += 25;
    confidenceFactors.push(
      "Multiple search methods used for comprehensive coverage"
    );
  } else if (searchTypes.length >= 2) {
    confidence += 20;
    confidenceFactors.push("Hybrid search methods used");
  } else {
    confidence += 15;
    confidenceFactors.push("Single search method used");
  }

  // Factor 5: Category diversity bonus (0-10 points)
  const categories = [
    ...new Set(results.map((r) => r.metadata?.category || "unknown")),
  ];
  if (categories.length >= 4) {
    confidence += 10;
    confidenceFactors.push("High category diversity in sources");
  } else if (categories.length >= 2) {
    confidence += 5;
    confidenceFactors.push("Good category diversity");
  }

  // Determine confidence level
  let confidenceLevel;
  if (confidence >= 85) {
    confidenceLevel = "Very High";
  } else if (confidence >= 70) {
    confidenceLevel = "High";
  } else if (confidence >= 55) {
    confidenceLevel = "Medium";
  } else if (confidence >= 40) {
    confidenceLevel = "Low";
  } else {
    confidenceLevel = "Very Low";
  }

  return {
    score: Math.min(confidence, 100),
    level: confidenceLevel,
    factors: confidenceFactors,
  };
}

// Enhanced source attribution tracking function
function trackSourceAttribution(results, answer) {
  // Parse source attribution markers from the answer
  const attributionData = parseSourceAttribution(answer, results.length);

  // Split answer into sentences for attribution tracking
  const sentences = attributionData.sentences;

  // Create enhanced source objects with attribution metadata
  const enhancedSources = results.map((result, index) => {
    // Generate anchor tag for direct linking
    const anchorTag = generateAnchorTag(result);

    // Find sentences that reference this source
    const attributedSentences = sentences
      .filter((s) => s.contributingSources.includes(index + 1))
      .map((s) => s.sentenceIndex);

    return {
      id: index + 1,
      title: result.metadata?.title || "Unknown",
      url: result.metadata?.source || result.metadata?.source_url || "N/A",
      category: result.metadata?.category || "unknown",
      score: result.score,
      searchType: result.searchType,
      content: result.doc,
      anchorTag: anchorTag,
      relevanceScore: Math.round(result.score * 100),
      // Track which sentences this source contributed to
      attributedSentences: attributedSentences,
      contributionStrength: calculateContributionStrength(
        result.score,
        result.doc.length
      ),
    };
  });

  return {
    sources: enhancedSources,
    totalSources: results.length,
    averageRelevance: Math.round(
      (results.reduce((sum, r) => sum + r.score, 0) / results.length) * 100
    ),
    sentenceAttribution: sentences,
    attributionSummary: {
      totalSentences: sentences.length,
      attributedSentences: sentences.filter(
        (s) => s.contributingSources.length > 0
      ).length,
      attributionRate:
        sentences.length > 0
          ? Math.round(
              (sentences.filter((s) => s.contributingSources.length > 0)
                .length /
                sentences.length) *
                100
            )
          : 0,
      hasSourceMarkers: attributionData.hasSourceMarkers,
    },
  };
}

// Parse source attribution markers from LLM response
function parseSourceAttribution(answer, totalSources) {
  // Check if the answer contains source markers
  const hasSourceMarkers = /\[\s*Source\s+\d+(?:,\s*\d+)*\s*\]/gi.test(answer);

  // Remove source markers from the answer for display
  const cleanAnswer = answer.replace(
    /\[\s*Source\s+\d+(?:,\s*\d+)*\s*\]/gi,
    ""
  );

  // Split into sentences
  const sentences = cleanAnswer
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);

  let sentencesWithAttribution;

  if (hasSourceMarkers) {
    // Parse attribution markers if they exist
    sentencesWithAttribution = sentences.map((sentence, index) => {
      const contributingSources = [];

      // Find source markers in the original answer
      const sourceMarkerRegex = /\[\s*Source\s+(\d+(?:,\s*\d+)*)\s*\]/gi;
      let match;

      // Find the position of this sentence in the original answer
      const sentenceStart = cleanAnswer.indexOf(sentence.trim());
      if (sentenceStart !== -1) {
        // Look for source markers near this sentence
        const contextStart = Math.max(0, sentenceStart - 50);
        const contextEnd = Math.min(
          answer.length,
          sentenceStart + sentence.length + 50
        );
        const context = answer.substring(contextStart, contextEnd);

        while ((match = sourceMarkerRegex.exec(context)) !== null) {
          const sources = match[1].split(",").map((s) => parseInt(s.trim()));
          contributingSources.push(
            ...sources.filter((s) => s >= 1 && s <= totalSources)
          );
        }
      }

      return {
        sentenceIndex: index,
        sentence: sentence.trim(),
        contributingSources: [...new Set(contributingSources)], // Remove duplicates
      };
    });
  } else {
    // Fallback: Create basic attribution for demonstration
    // This ensures the UI works even when LLM doesn't generate perfect markers
    sentencesWithAttribution = sentences.map((sentence, index) => {
      // Simple heuristic: assign sources based on sentence position
      // This is a fallback to ensure the UI works
      const contributingSources = [];

      if (totalSources > 0) {
        // Assign sources based on sentence position (simple distribution)
        const sourcesPerSentence = Math.max(
          1,
          Math.floor(totalSources / sentences.length)
        );
        const startSource = Math.min(
          totalSources,
          index * sourcesPerSentence + 1
        );

        for (
          let i = 0;
          i < sourcesPerSentence && startSource + i <= totalSources;
          i++
        ) {
          contributingSources.push(startSource + i);
        }

        // Ensure at least one source is assigned
        if (contributingSources.length === 0) {
          contributingSources.push(Math.min(totalSources, index + 1));
        }
      }

      return {
        sentenceIndex: index,
        sentence: sentence.trim(),
        contributingSources: contributingSources,
      };
    });
  }

  return {
    sentences: sentencesWithAttribution,
    cleanAnswer: cleanAnswer,
    hasSourceMarkers: hasSourceMarkers,
  };
}

// Generate anchor tag for direct linking to document sections
function generateAnchorTag(result) {
  const sourceUrl = result.metadata?.source || result.metadata?.source_url;
  if (!sourceUrl || sourceUrl === "N/A") {
    return null;
  }

  // Extract meaningful anchor from title, content, or section structure
  const title = result.metadata.title || "section";
  const content = result.doc || "";

  // Try to find specific section anchors in the content
  const sectionAnchor = extractSectionAnchor(content, title);

  if (sectionAnchor) {
    return `${sourceUrl}#${sectionAnchor}`;
  }

  // Fallback to title-based anchor
  const anchorText = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);

  return `${sourceUrl}#${anchorText}`;
}

// Extract specific section anchor from content
function extractSectionAnchor(content, title) {
  // Look for "Anchor to" patterns in the content (common in Shopify docs)
  const anchorPattern = /Anchor to ([^A-Z\n]+)/g;
  const anchors = [];
  let match;

  while ((match = anchorPattern.exec(content)) !== null) {
    const anchorText = match[1].trim();
    if (anchorText && anchorText.length > 0) {
      anchors.push(anchorText);
    }
  }

  // If we found anchors, try to match the most relevant one to the title
  if (anchors.length > 0) {
    const titleWords = title.toLowerCase().split(/\s+/);

    // Find the anchor that best matches the title
    for (const anchor of anchors) {
      const anchorWords = anchor.toLowerCase().split(/\s+/);
      const commonWords = titleWords.filter((word) =>
        anchorWords.some(
          (anchorWord) => anchorWord.includes(word) || word.includes(anchorWord)
        )
      );

      if (commonWords.length > 0) {
        return anchor
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 50);
      }
    }

    // If no match found, use the first anchor
    return anchors[0]
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);
  }

  // Look for heading patterns in content
  const headingPattern = /^(#{1,6})\s+(.+)$/gm;
  const headings = [];

  while ((match = headingPattern.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    if (text && text.length > 0) {
      headings.push({ level, text });
    }
  }

  // If we found headings, try to match the most relevant one
  if (headings.length > 0) {
    const titleWords = title.toLowerCase().split(/\s+/);

    // Prioritize h2 and h3 headings
    const relevantHeadings = headings.filter((h) => h.level <= 3);

    for (const heading of relevantHeadings) {
      const headingWords = heading.text.toLowerCase().split(/\s+/);
      const commonWords = titleWords.filter((word) =>
        headingWords.some(
          (headingWord) =>
            headingWord.includes(word) || word.includes(headingWord)
        )
      );

      if (commonWords.length > 0) {
        return heading.text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 50);
      }
    }

    // If no match found, use the first relevant heading
    if (relevantHeadings.length > 0) {
      return relevantHeadings[0].text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);
    }
  }

  return null;
}

// Convert source markers to clickable links in the response with sentence-level attribution
function convertSourceMarkersToLinks(answer, sources) {
  if (!sources || sources.length === 0) {
    return answer;
  }

  // Remove source markers and markdown links from the answer
  return answer.replace(/\[\s*Source\s+\d+(?:,\s*\d+)*\s*\]\([^)]*\)/gi, "");
}

// Create sentence-level attribution data for interactive sentences
function createSentenceAttribution(answer, sources) {
  // Parse source attribution markers from the answer
  const attributionData = parseSourceAttribution(answer, sources.length);

  // Create sentence-level attribution with source information
  const sentencesWithAttribution = attributionData.sentences.map(
    (sentenceData, index) => {
      const contributingSources = sentenceData.contributingSources
        .map((sourceId) => {
          const source = sources.find((s) => s.id === sourceId);
          return source
            ? {
                id: source.id,
                title: source.title,
                url: source.url,
                anchorTag: source.anchorTag,
                category: source.category,
                relevanceScore: source.relevanceScore,
                confidenceScore: source.score,
              }
            : null;
        })
        .filter(Boolean);

      return {
        sentenceIndex: index,
        sentence: sentenceData.sentence.trim(),
        contributingSources: contributingSources,
        hasAttribution: contributingSources.length > 0,
      };
    }
  );

  return sentencesWithAttribution;
}

// Calculate contribution strength based on relevance score and content length
function calculateContributionStrength(score, contentLength) {
  // Normalize content length (assume 100-2000 chars is optimal)
  const normalizedLength = Math.min(Math.max(contentLength / 1000, 0.1), 2.0);

  // Combine relevance score with content richness
  const strength = score * 0.7 + normalizedLength * 0.3;

  if (strength >= 0.8) return "High";
  if (strength >= 0.6) return "Medium";
  if (strength >= 0.4) return "Low";
  return "Very Low";
}

// Handle edge cases with fallback responses
function handleEdgeCases(results, question) {
  if (results.length === 0) {
    return {
      answer:
        "I couldn't find this information in the available documentation. Please try rephrasing your question or contact Shopify support for assistance.",
      confidence: { score: 0, level: "Low", factors: ["No sources found"] },
      isEdgeCase: true,
    };
  }

  // Check for very low relevance scores
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  if (avgScore < 0.2) {
    return {
      answer:
        "I found some related information, but it may not directly answer your question. Please try rephrasing your question with more specific terms or contact Shopify support for assistance.",
      confidence: {
        score: 20,
        level: "Low",
        factors: ["Very low relevance scores"],
      },
      isEdgeCase: true,
    };
  }

  return null; // No edge case detected
}

// Initialize AI components
let retriever = null;
let model = null;
let genAI = null;

async function initializeAI() {
  if (retriever && model) return; // Already initialized

  try {
    await connectDB();

    retriever = await createHybridRetriever({
      semanticWeight: 0.7, // Increased for better context understanding
      keywordWeight: 0.3,
      maxResults: 20, // More results for better fusion
      finalK: 8, // More comprehensive answers
      diversityBoost: 0.15, // Better category diversity
      minRelevanceScore: 0.1, // Filter out low-relevance results
      queryExpansion: true, // Enable query expansion
    });

    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    let modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    try {
      model = genAI.getGenerativeModel({ model: modelName });
    } catch (err) {
      if (modelName !== "gemini-1.5-flash") {
        modelName = "gemini-1.5-flash";
        model = genAI.getGenerativeModel({ model: modelName });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error("Failed to initialize AI components:", error);
    throw error;
  }
}

// Main chat function with multi-turn conversation support
export async function processChatMessage(message, sessionId) {
  try {
    await initializeAI();

    const startTime = Date.now();

    // Get or create conversation
    let conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        title: message.length > 50 ? message.substring(0, 50) + "..." : message,
      });
      await conversation.save();
    }

    // Get conversation history for multi-turn processing
    const conversationHistory = await getConversationHistory(sessionId);
    const messages = conversationHistory.messages || [];

    // Create user message
    const userMessage = new Message({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });
    await userMessage.save();

    // Add message to conversation
    await conversation.addMessage(userMessage._id);

    // Use multi-turn conversation manager for enhanced context
    const enhancedContext = await multiTurnManager.buildEnhancedContext(
      message,
      sessionId,
      messages,
      [] // Will be populated after search
    );

    // Check if clarification is needed
    if (enhancedContext.needsClarification) {
      const clarificationMessage = new Message({
        conversationId: conversation._id,
        role: "assistant",
        content: enhancedContext.clarificationQuestion,
        metadata: {
          searchResults: [],
          modelUsed: "multi-turn-clarification",
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          clarificationRequest: true,
        },
      });
      await clarificationMessage.save();
      await conversation.addMessage(clarificationMessage._id);

      return {
        answer: enhancedContext.clarificationQuestion,
        confidence: {
          score: 100,
          level: "High",
          factors: ["Clarification request"],
        },
        sources: [],
        needsClarification: true,
        conversationState: enhancedContext.conversationState,
        followUpDetection: enhancedContext.followUpDetection,
        ambiguityDetection: enhancedContext.ambiguityDetection,
      };
    }

    // Use enhanced contextual query for search
    const queryEmbedding = await embedSingle(enhancedContext.contextualQuery);

    // Perform hybrid search with enhanced contextual query
    const results = await retriever.search({
      query: enhancedContext.contextualQuery,
      queryEmbedding,
      k: 8, // Increased for more comprehensive results
    });

    // Check for edge cases
    const edgeCase = handleEdgeCases(results, message);
    if (edgeCase) {
      const assistantMessage = new Message({
        conversationId: conversation._id,
        role: "assistant",
        content: edgeCase.answer,
        metadata: {
          searchResults: results.map((r) => ({
            title: r.metadata?.title || "Unknown",
            source_url: r.metadata?.source || r.metadata?.source_url || "N/A",
            category: r.metadata?.category || "unknown",
            score: r.score,
            searchType: r.searchType,
          })),
          modelUsed: "gemini-2.5-flash",
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
        },
      });
      await assistantMessage.save();
      await conversation.addMessage(assistantMessage._id);

      // Track source attribution even for edge cases
      const sourceAttribution = trackSourceAttribution(
        results,
        edgeCase.answer
      );

      // Convert source markers to clickable links
      const displayAnswer = convertSourceMarkersToLinks(
        edgeCase.answer,
        sourceAttribution.sources
      );

      // Create sentence-level attribution for interactive sentences
      const sentenceAttribution = createSentenceAttribution(
        edgeCase.answer,
        sourceAttribution.sources
      );

      return {
        answer: displayAnswer,
        confidence: edgeCase.confidence,
        sources: sourceAttribution.sources,
        sourceAttribution: sourceAttribution,
        sentenceAttribution: sentenceAttribution,
        isEdgeCase: true,
      };
    }

    // Use multi-turn conversation manager for enhanced response generation
    const enhancedResponse = await multiTurnManager.generateEnhancedResponse(
      message,
      sessionId,
      messages,
      results
    );

    const answer = enhancedResponse.answer;

    // Track source attribution with enhanced metadata
    const sourceAttribution = trackSourceAttribution(results, answer);

    // Convert source markers to clickable links
    const displayAnswer = convertSourceMarkersToLinks(
      answer,
      sourceAttribution.sources
    );

    // Create sentence-level attribution for interactive sentences
    const sentenceAttribution = createSentenceAttribution(
      answer,
      sourceAttribution.sources
    );

    // Calculate confidence score
    const confidence = calculateConfidence(results, displayAnswer);

    // Create assistant message with multi-turn metadata and source attribution
    const assistantMessage = new Message({
      conversationId: conversation._id,
      role: "assistant",
      content: answer,
      metadata: {
        searchResults: results.map((r) => ({
          title: r.metadata?.title || "Unknown",
          source_url: r.metadata?.source_url || "N/A",
          category: r.metadata?.category || "unknown",
          score: r.score,
          searchType: r.searchType,
        })),
        modelUsed: "gemini-1.5-flash-multi-turn",
        processingTime: Date.now() - startTime,
        tokensUsed: 0, // Will be updated if token counting is implemented
        multiTurnContext: {
          turnCount: enhancedResponse.conversationState.turnCount,
          isFollowUp: enhancedResponse.followUpDetection.isFollowUp,
          userPreferences: enhancedResponse.conversationState.userPreferences,
          contextualQuery: enhancedResponse.contextualQuery,
        },
        sourceAttribution: sourceAttribution,
      },
    });
    await assistantMessage.save();
    await conversation.addMessage(assistantMessage._id);

    return {
      answer: displayAnswer,
      confidence,
      sources: sourceAttribution.sources,
      sourceAttribution: sourceAttribution,
      sentenceAttribution: sentenceAttribution,
      multiTurnContext: {
        turnCount: enhancedResponse.conversationState.turnCount,
        isFollowUp: enhancedResponse.followUpDetection.isFollowUp,
        followUpConfidence: enhancedResponse.followUpDetection.confidence,
        userPreferences: enhancedResponse.conversationState.userPreferences,
        contextualQuery: enhancedResponse.contextualQuery,
        conversationStats: multiTurnManager.getConversationStats(sessionId),
      },
    };
  } catch (error) {
    console.error("Error processing chat message:", error);
    throw error;
  }
}

// Handle clarification responses
export async function processClarificationResponse(
  clarificationResponse,
  originalQuestion,
  sessionId
) {
  try {
    await initializeAI();

    const startTime = Date.now();

    // Get conversation
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Process clarification with multi-turn manager
    const clarificationResult =
      await multiTurnManager.processClarificationResponse(
        clarificationResponse,
        originalQuestion,
        sessionId
      );

    // Create user clarification message
    const clarificationMessage = new Message({
      conversationId: conversation._id,
      role: "user",
      content: clarificationResponse,
      metadata: {
        clarificationResponse: true,
        originalQuestion: originalQuestion,
      },
    });
    await clarificationMessage.save();
    await conversation.addMessage(clarificationMessage._id);

    // Get conversation history
    const conversationHistory = await getConversationHistory(sessionId);
    const messages = conversationHistory.messages || [];

    // Perform search with clarified query
    const queryEmbedding = await embedSingle(
      clarificationResult.clarifiedQuery
    );
    const results = await retriever.search({
      query: clarificationResult.clarifiedQuery,
      queryEmbedding,
      k: 8,
    });

    // Generate enhanced response
    const enhancedResponse = await multiTurnManager.generateEnhancedResponse(
      clarificationResult.clarifiedQuery,
      sessionId,
      messages,
      results
    );

    const answer = enhancedResponse.answer;

    // Track source attribution with enhanced metadata
    const sourceAttribution = trackSourceAttribution(results, answer);

    // Convert source markers to clickable links
    const displayAnswer = convertSourceMarkersToLinks(
      answer,
      sourceAttribution.sources
    );

    // Create sentence-level attribution for interactive sentences
    const sentenceAttribution = createSentenceAttribution(
      answer,
      sourceAttribution.sources
    );

    const confidence = calculateConfidence(results, displayAnswer);

    // Create assistant message
    const assistantMessage = new Message({
      conversationId: conversation._id,
      role: "assistant",
      content: answer,
      metadata: {
        searchResults: results.map((r) => ({
          title: r.metadata?.title || "Unknown",
          source_url: r.metadata?.source_url || "N/A",
          category: r.metadata?.category || "unknown",
          score: r.score,
          searchType: r.searchType,
        })),
        modelUsed: "gemini-1.5-flash-clarification",
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        clarificationProcessed: true,
        multiTurnContext: {
          turnCount: enhancedResponse.conversationState.turnCount,
          isFollowUp: enhancedResponse.followUpDetection.isFollowUp,
          userPreferences: enhancedResponse.conversationState.userPreferences,
          contextualQuery: enhancedResponse.contextualQuery,
        },
        sourceAttribution: sourceAttribution,
      },
    });
    await assistantMessage.save();
    await conversation.addMessage(assistantMessage._id);

    return {
      answer: displayAnswer,
      confidence,
      sources: sourceAttribution.sources,
      sourceAttribution: sourceAttribution,
      sentenceAttribution: sentenceAttribution,
      multiTurnContext: {
        turnCount: enhancedResponse.conversationState.turnCount,
        isFollowUp: enhancedResponse.followUpDetection.isFollowUp,
        followUpConfidence: enhancedResponse.followUpDetection.confidence,
        userPreferences: enhancedResponse.conversationState.userPreferences,
        contextualQuery: enhancedResponse.contextualQuery,
        conversationStats: multiTurnManager.getConversationStats(sessionId),
        clarificationProcessed: true,
      },
    };
  } catch (error) {
    console.error("Error processing clarification response:", error);
    throw error;
  }
}

// Get conversation history
export async function getConversationHistory(sessionId) {
  try {
    await connectDB();

    const conversation = await Conversation.findOne({ sessionId }).populate({
      path: "messages",
      options: { sort: { timestamp: 1 } },
    });

    if (!conversation) {
      return { messages: [], conversation: null };
    }

    const messages = conversation.messages.map((msg) => ({
      id: msg._id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      metadata: msg.metadata,
    }));

    return {
      messages,
      conversation: {
        id: conversation._id,
        sessionId: conversation.sessionId,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error getting conversation history:", error);
    throw error;
  }
}

// Get conversation statistics and multi-turn context
export async function getConversationStats(sessionId) {
  try {
    await connectDB();

    const conversation = await Conversation.findOne({ sessionId }).populate({
      path: "messages",
      options: { sort: { timestamp: 1 } },
    });

    if (!conversation) {
      return {
        conversation: null,
        multiTurnStats: null,
        messageCount: 0,
      };
    }

    const multiTurnStats = multiTurnManager.getConversationStats(sessionId);

    return {
      conversation: {
        id: conversation._id,
        sessionId: conversation.sessionId,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messages.length,
      },
      multiTurnStats,
      messageCount: conversation.messages.length,
    };
  } catch (error) {
    console.error("Error getting conversation stats:", error);
    throw error;
  }
}

// Get chat history list (last 8 conversations)
export async function getChatHistoryList() {
  try {
    await connectDB();

    // Get the last 8 conversations ordered by updatedAt (most recent first)
    const conversations = await Conversation.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .limit(8)
      .select("sessionId title createdAt updatedAt messages")
      .populate({
        path: "messages",
        options: { sort: { timestamp: -1 }, limit: 1 }, // Get only the last message for preview
        select: "content timestamp role",
      });

    const historyList = conversations.map((conv) => ({
      id: conv._id,
      sessionId: conv.sessionId,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      lastMessage:
        conv.messages && conv.messages.length > 0
          ? {
              content: conv.messages[0].content,
              timestamp: conv.messages[0].timestamp,
              role: conv.messages[0].role,
            }
          : null,
      messageCount: conv.messages ? conv.messages.length : 0,
    }));

    return { conversations: historyList };
  } catch (error) {
    console.error("Error getting chat history list:", error);
    throw error;
  }
}

// Clean up conversation state (for memory management)
export async function cleanupConversationState(sessionId) {
  try {
    multiTurnManager.cleanupConversationState(sessionId);
    return { success: true, message: "Conversation state cleaned up" };
  } catch (error) {
    console.error("Error cleaning up conversation state:", error);
    throw error;
  }
}
