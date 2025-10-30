/**
 * Query Preprocessor for BM25 Search
 * Extracts key terms and improves query compatibility with PostgreSQL full-text search
 */
class QueryPreprocessor {
  constructor() {
    // Common stop words to remove
    this.stopWords = new Set([
      "how","to","and","or","but","in","on","at","for","of","with","by","the",
      "a","an","is","are","was","were","be","been","being","have","has","had",
      "do","does","did","will","would","could","should","may","might","can",
      "this","that","these","those","i","you","he","she","it","we","they"
    ]);

    this.technicalTerms = new Set([
      "api","webhook","sdk","error","twilio","connect","troubleshoot","debug",
      "fix","resolve","handle","manage","sms","voice","libraries","video",
      "whatsapp","statuscallback","callback","delivery","authentication",
      "token","capability","call","message","response","endpoint","sid",
      "accountsid","auth","media","recording","conference","participant",
      "number","sender","receiver","request","body","parameters",
      "incoming","outgoing","errorcode"
    ]);
  }

  /**
   * Preprocess query for better BM25 search compatibility
   * @param {string} query - Original query
   * @returns {string} - Preprocessed query
   */
  preprocessForBM25(query) {
    if (!query || typeof query !== "string") {
      return "";
    }

    console.log(`\n🔧 Preprocessing query: "${query}"`);

    // Step 1: Convert to lowercase
    let processed = query.toLowerCase().trim();

    // Step 2: Remove special characters but keep hyphens and underscores
    processed = processed.replace(/[^\w\s-]/g, " ");

    // Step 3: Split into words and filter
    const words = processed
      .split(/\s+/)
      .filter((word) => word.length > 1) // Remove single characters
      .filter((word) => !this.stopWords.has(word)) // Remove stop words
      .filter((word) => word.length > 2); // Keep only meaningful words

    // Step 4: Prioritize technical terms
    const technicalWords = words.filter((word) =>
      this.technicalTerms.has(word)
    );
    const otherWords = words.filter((word) => !this.technicalTerms.has(word));

    // Step 5: Combine with technical terms first
    const finalWords = [...technicalWords, ...otherWords];

    // Step 6: Limit to reasonable length (PostgreSQL has limits)
    const limitedWords = finalWords.slice(0, 8);

    const result = limitedWords.join(" ");

    console.log(`   Original: "${query}"`);
    console.log(`   Processed: "${result}"`);
    console.log(`   Technical terms: [${technicalWords.join(", ")}]`);
    console.log(`   Other terms: [${otherWords.join(", ")}]`);

    return result;
  }

  /**
   * Extract key terms from query for better matching
   * @param {string} query - Original query
   * @returns {Object} - Extracted terms
   */
  extractKeyTerms(query) {
    const processed = this.preprocessForBM25(query);
    const words = processed.split(/\s+/);

    return {
      original: query,
      processed: processed,
      technicalTerms: words.filter((word) => this.technicalTerms.has(word)),
      allTerms: words,
      wordCount: words.length,
    };
  }

  /**
   * Generate multiple query variations for better coverage
   * @param {string} query - Original query
   * @returns {Array} - Array of query variations
   */
  generateQueryVariations(query) {
    const keyTerms = this.extractKeyTerms(query);
    const variations = [];

    // Add the processed query
    if (keyTerms.processed) {
      variations.push(keyTerms.processed);
    }

    // Add technical terms only
    if (keyTerms.technicalTerms.length > 0) {
      variations.push(keyTerms.technicalTerms.join(" "));
    }

    // Add individual technical terms
    keyTerms.technicalTerms.forEach((term) => {
      variations.push(term);
    });

    // Add 2-word combinations of technical terms
    for (let i = 0; i < keyTerms.technicalTerms.length - 1; i++) {
      for (let j = i + 1; j < keyTerms.technicalTerms.length; j++) {
        variations.push(
          `${keyTerms.technicalTerms[i]} ${keyTerms.technicalTerms[j]}`
        );
      }
    }

    // Remove duplicates and empty strings
    const uniqueVariations = [...new Set(variations)].filter(
      (v) => v.trim().length > 0
    );

    console.log(
      `🔄 Generated ${uniqueVariations.length} query variations:`,
      uniqueVariations
    );

    return uniqueVariations;
  }
}

export default QueryPreprocessor;