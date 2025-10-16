import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * BM25 (Best Matching 25) implementation for keyword search
 * BM25 is a probabilistic ranking function used by search engines
 */
class BM25Search {
  constructor(k1 = 1.2, b = 0.75) {
    this.k1 = k1; // Term frequency saturation parameter
    this.b = b;   // Length normalization parameter
    this.documents = [];
    this.docFreqs = {}; // Document frequency for each term
    this.idf = {};      // Inverse document frequency
    this.docLengths = []; // Length of each document
    this.avgDocLength = 0;
    this.totalDocs = 0;
    this.isIndexed = false;
  }

  /**
   * Tokenize text into terms
   */
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter(term => term.length > 0); // Remove empty strings
  }

  /**
   * Remove stop words from terms
   */
  removeStopWords(terms) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'how', 'when',
      'where', 'why', 'who', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her',
      'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs'
    ]);
    
    return terms.filter(term => !stopWords.has(term));
  }

  /**
   * Build the BM25 index from documents
   */
  buildIndex(documents) {
    console.log("🔍 Building BM25 index...");
    
    this.documents = documents;
    this.totalDocs = documents.length;
    this.docLengths = [];
    this.docFreqs = {};
    
    // Calculate document lengths and term frequencies
    documents.forEach((doc, docIndex) => {
      const content = doc.content || doc.pageContent || '';
      const terms = this.removeStopWords(this.tokenize(content));
      this.docLengths[docIndex] = terms.length;
      
      // Count term frequencies in this document
      const termFreqs = {};
      terms.forEach(term => {
        termFreqs[term] = (termFreqs[term] || 0) + 1;
      });
      
      // Update document frequencies
      Object.keys(termFreqs).forEach(term => {
        if (!this.docFreqs[term]) {
          this.docFreqs[term] = 0;
        }
        this.docFreqs[term]++;
      });
    });
    
    // Calculate average document length
    this.avgDocLength = this.docLengths.reduce((sum, len) => sum + len, 0) / this.totalDocs;
    
    // Calculate IDF (Inverse Document Frequency) for each term
    Object.keys(this.docFreqs).forEach(term => {
      this.idf[term] = Math.log((this.totalDocs - this.docFreqs[term] + 0.5) / (this.docFreqs[term] + 0.5));
    });
    
    this.isIndexed = true;
    console.log(`✅ BM25 index built for ${this.totalDocs} documents`);
    console.log(`📊 Average document length: ${this.avgDocLength.toFixed(2)} terms`);
    console.log(`📝 Unique terms: ${Object.keys(this.docFreqs).length}`);
  }

  /**
   * Calculate BM25 score for a query against a document
   */
  calculateBM25Score(queryTerms, docIndex) {
    const doc = this.documents[docIndex];
    const content = doc.content || doc.pageContent || '';
    const docTerms = this.removeStopWords(this.tokenize(content));
    const docLength = this.docLengths[docIndex];
    
    let score = 0;
    
    // Count term frequencies in the document
    const termFreqs = {};
    docTerms.forEach(term => {
      termFreqs[term] = (termFreqs[term] || 0) + 1;
    });
    
    // Calculate BM25 score for each query term
    queryTerms.forEach(term => {
      if (this.idf[term] && termFreqs[term]) {
        const tf = termFreqs[term];
        const idf = this.idf[term];
        
        // BM25 formula
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
        
        score += idf * (numerator / denominator);
      }
    });
    
    return score;
  }

  /**
   * Search documents using BM25
   */
  search(query, limit = 10) {
    if (!this.isIndexed) {
      console.log("❌ BM25 index not built. Call buildIndex() first.");
      return [];
    }
    
    const queryTerms = this.removeStopWords(this.tokenize(query));
    
    if (queryTerms.length === 0) {
      return [];
    }
    
    console.log(`🔍 BM25 search for: "${query}" (${queryTerms.length} terms)`);
    
    // Calculate BM25 scores for all documents
    const scoredDocs = this.documents.map((doc, index) => ({
      ...doc,
      bm25Score: this.calculateBM25Score(queryTerms, index),
      docIndex: index
    }));
    
    // Sort by BM25 score and return top results
    return scoredDocs
      .filter(doc => doc.bm25Score > 0)
      .sort((a, b) => b.bm25Score - a.bm25Score)
      .slice(0, limit)
      .map(doc => ({
        content: doc.content || doc.pageContent || '',
        source: doc.metadata?.source || doc.metadata?.title || 'Discord Documentation',
        score: doc.bm25Score,
        bm25Score: doc.bm25Score,
        metadata: doc.metadata || {},
        docIndex: doc.docIndex
      }));
  }

  /**
   * Load documents from file
   */
  loadDocuments() {
    try {
      // Try multiple possible locations for document data
      const possiblePaths = [
        path.join(__dirname, "../../data/gemini_embeddings.json"),
        path.join(__dirname, "../../data/embeddings.json"),
        path.join(__dirname, "../data/processed/discord_chunks.json"),
        path.join(__dirname, "../data/chunks/metadata.json")
      ];
      
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          console.log(`📂 Loading documents from: ${filePath}`);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          // Handle different data formats
          let documents = [];
          if (Array.isArray(data)) {
            documents = data.map(item => ({
              content: item.content || item.pageContent || '',
              metadata: item.metadata || {},
              id: item.id || `${Date.now()}_${Math.random()}`
            }));
          }
          
          console.log(`✅ Loaded ${documents.length} documents for BM25 indexing`);
          return documents;
        }
      }
      
      console.log("❌ No document files found for BM25 indexing");
      return [];
      
    } catch (error) {
      console.error("❌ Error loading documents for BM25:", error.message);
      return [];
    }
  }
}

// Create singleton instance
const bm25Search = new BM25Search();

export { bm25Search, BM25Search };
