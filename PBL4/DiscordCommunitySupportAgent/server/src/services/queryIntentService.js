import { embedQueryWithGemini } from '../repositories/geminiEmbeddings.js';

/**
 * Query Intent Service
 * Uses Gemini embeddings for semantic intent detection
 * Supports multi-intent classification with confidence scoring
 */
class QueryIntentService {
  constructor() {
    // Intent definitions with semantic examples for embedding
    this.intentExamples = {
      gaming: "questions about gaming servers, tournaments, esports, gaming communities, streaming, and game-related Discord features",
      study: "questions about study groups, educational servers, learning communities, academic Discord setups, homework help",
      permissions: "questions about Discord roles, permissions, admin rights, bitfields, permission calculations, role management",
      moderation: "questions about moderation tools, auto-moderation, banning users, server moderation, audit logs, moderation bots",
      bots: "questions about Discord bots, bot setup, bot integration, bot development, slash commands, bot tokens",
      api_webhooks: "questions about Discord API, webhooks, OAuth2, developer tools, API integration, webhook setup",
      community: "questions about server setup, creating communities, inviting members, general Discord server management",
      voice: "questions about voice channels, voice chat setup, audio settings, microphone configuration, voice permissions",
      safety_privacy: "questions about safety features, privacy settings, reporting users, blocking, server verification",
      troubleshooting: "questions about fixing errors, resolving issues, troubleshooting problems, Discord support"
    };

    // Map intent categories to document metadata categories/tags
    this.intentToCategoryMap = {
      gaming: ['gaming', 'community', 'voice', 'general'],
      study: ['study', 'community', 'general'],
      permissions: ['permissions', 'community', 'general'],
      moderation: ['moderation', 'community', 'general'],
      bots: ['bots', 'community', 'general'],
      api_webhooks: ['bots', 'community', 'general'], // API/webhooks often in bot docs
      community: ['community', 'general', 'voice'],
      voice: ['voice', 'community', 'general'],
      safety_privacy: ['community', 'general'],
      troubleshooting: ['general', 'community']
    };

    this.intentEmbeddings = null;
    this.isInitialized = false;
  }

  /**
   * Initialize intent embeddings using Gemini
   */
  async initialize() {
    if (this.isInitialized && this.intentEmbeddings) {
      return true;
    }

    try {
      console.log('🧠 Initializing query intent embeddings...');
      
      this.intentEmbeddings = {};
      
      // Create embeddings for each intent in parallel
      const embeddingPromises = Object.entries(this.intentExamples).map(
        async ([intent, example]) => {
          try {
            const embedding = await embedQueryWithGemini(example);
            return { intent, embedding };
          } catch (error) {
            console.error(`❌ Error embedding intent ${intent}:`, error.message);
            return null;
          }
        }
      );

      const results = await Promise.all(embeddingPromises);
      
      results.forEach(result => {
        if (result) {
          this.intentEmbeddings[result.intent] = result.embedding;
        }
      });

      this.isInitialized = true;
      console.log(`✅ Initialized ${Object.keys(this.intentEmbeddings).length} intent embeddings`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize intent embeddings:', error.message);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Detect multiple intents from query using semantic similarity
   * @param {string} query - User query
   * @param {Object} serverContext - Server context for additional hints
   * @param {number} threshold - Minimum confidence threshold (default: 0.3)
   * @returns {Promise<Object>} Intent classification with multiple intents and confidence scores
   */
  async detectIntents(query, serverContext = {}, threshold = 0.3) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.intentEmbeddings || Object.keys(this.intentEmbeddings).length === 0) {
      console.warn('⚠️ Intent embeddings not available, using fallback');
      return {
        intents: [{ label: 'general', confidence: 0.5 }],
        primaryIntent: 'general',
        confidence: 0.5,
        relevantCategories: ['general']
      };
    }

    try {
      // Get query embedding
      const queryEmbedding = await embedQueryWithGemini(query);

      // Calculate similarities with all intent embeddings
      const intentSimilarities = Object.entries(this.intentEmbeddings).map(([intent, embedding]) => ({
        label: intent,
        confidence: this.cosineSimilarity(queryEmbedding, embedding)
      }));

      // Sort all intents by confidence for display
      const sortedAllIntents = intentSimilarities
        .sort((a, b) => b.confidence - a.confidence);
      
      console.log('\n📊 INTENT CLASSIFICATION RESULTS:');
      console.log('═'.repeat(60));
      console.log(`Query: "${query}"`);
      if (serverContext.type) {
        console.log(`Server Context: ${serverContext.type} server`);
      }
      console.log('\nAll Intent Scores (sorted):');
      sortedAllIntents.forEach((intent, index) => {
        const marker = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        console.log(`  ${marker} ${intent.label.padEnd(20)}: ${intent.confidence.toFixed(3)}`);
      });

      // Boost confidence based on server context
      if (serverContext.type && this.intentEmbeddings[serverContext.type]) {
        const contextBoost = 0.2;
        const intentIndex = intentSimilarities.findIndex(i => i.label === serverContext.type);
        if (intentIndex !== -1) {
          const originalConfidence = intentSimilarities[intentIndex].confidence;
          intentSimilarities[intentIndex].confidence = Math.min(
            originalConfidence + contextBoost,
            1.0
          );
          console.log(`\n⚡ Server Context Boost: +${contextBoost.toFixed(2)} for "${serverContext.type}"`);
          console.log(`   Before: ${originalConfidence.toFixed(3)} → After: ${intentSimilarities[intentIndex].confidence.toFixed(3)}`);
        }
      }

      // Re-sort after context boost
      const sortedAfterBoost = intentSimilarities
        .sort((a, b) => b.confidence - a.confidence);
      
      // Filter by threshold and sort by confidence
      const filteredIntents = sortedAfterBoost
        .filter(i => i.confidence >= threshold);

      // If no intents pass threshold, use top 2 with lower confidence
      let activeIntents = filteredIntents;
      if (activeIntents.length === 0) {
        activeIntents = intentSimilarities
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 2)
          .map(i => ({ ...i, confidence: Math.max(i.confidence, 0.3) }));
      }

      const primaryIntent = activeIntents[0];
      
      // Get relevant categories for filtering
      const relevantCategories = this.getRelevantCategories(activeIntents);

      // Display active intents
      console.log(`\n✅ Active Intents (threshold: ${threshold}):`);
      activeIntents.forEach((intent, index) => {
        const label = index === 0 ? 'PRIMARY' : `SECONDARY ${index}`;
        console.log(`  ${label}: ${intent.label} (confidence: ${intent.confidence.toFixed(3)})`);
      });
      
      console.log(`\n📂 Relevant Document Categories: ${relevantCategories.join(', ')}`);
      console.log('═'.repeat(60) + '\n');

      return {
        intents: activeIntents,
        primaryIntent: primaryIntent.label,
        confidence: primaryIntent.confidence,
        relevantCategories,
        allScores: intentSimilarities.reduce((acc, i) => {
          acc[i.label] = i.confidence;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('❌ Error detecting intents:', error.message);
      return {
        intents: [{ label: 'general', confidence: 0.5 }],
        primaryIntent: 'general',
        confidence: 0.5,
        relevantCategories: ['general']
      };
    }
  }

  /**
   * Get relevant categories from detected intents
   */
  getRelevantCategories(intents) {
    const categorySet = new Set();
    
    intents.forEach(intent => {
      const categories = this.intentToCategoryMap[intent.label] || ['general'];
      categories.forEach(cat => categorySet.add(cat));
    });

    return Array.from(categorySet);
  }

  /**
   * Get boost multiplier based on intent match with document
   * @param {Object} intentClassification - Result from detectIntents
   * @param {Object} documentMetadata - Document metadata with category/tags
   * @returns {number} Boost multiplier (1.0 = neutral, >1.0 = boost, <1.0 = penalty)
   */
  getBoostMultiplier(intentClassification, documentMetadata) {
    if (!intentClassification || !documentMetadata) return 1.0;

    const docCategory = documentMetadata?.category || 'general';
    const docTags = documentMetadata?.tags || [];
    const { intents, relevantCategories } = intentClassification;

    // Check primary intent match
    const primaryIntent = intents[0];
    if (primaryIntent) {
      const primaryCategories = this.intentToCategoryMap[primaryIntent.label] || ['general'];
      
      // Exact category match with primary intent
      if (primaryCategories.includes(docCategory)) {
        return 1.0 + (primaryIntent.confidence * 0.6); // Boost: 1.0 to 1.6
      }
      
      // Tag match with primary intent
      if (docTags.some(tag => primaryCategories.includes(tag))) {
        return 1.0 + (primaryIntent.confidence * 0.4); // Boost: 1.0 to 1.4
      }
    }

    // Check secondary intents
    for (let i = 1; i < intents.length && i < 3; i++) {
      const secondaryIntent = intents[i];
      const secondaryCategories = this.intentToCategoryMap[secondaryIntent.label] || ['general'];
      
      if (secondaryCategories.includes(docCategory) || 
          docTags.some(tag => secondaryCategories.includes(tag))) {
        return 1.0 + (secondaryIntent.confidence * 0.3); // Boost: 1.0 to 1.3
      }
    }

    // Check if document category is in relevant categories (broader match)
    if (relevantCategories.includes(docCategory)) {
      return 1.0 + 0.2; // Small boost: 1.2
    }

    if (docTags.some(tag => relevantCategories.includes(tag))) {
      return 1.0 + 0.1; // Small boost: 1.1
    }

    // Penalty for completely irrelevant documents
    if (docCategory !== 'general') {
      return 0.6; // Penalty
    }

    // Keep general category neutral
    return 1.0;
  }
}

export default new QueryIntentService();
