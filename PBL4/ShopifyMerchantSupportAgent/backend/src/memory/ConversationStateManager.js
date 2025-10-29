/**
 * ConversationStateManager - Optimized with TTL and LRU Eviction
 *
 * This class manages conversation states with automatic cleanup to prevent memory leaks.
 * Features:
 * - Time-based eviction (TTL): Removes sessions older than configured maxAge
 * - LRU eviction: Removes least recently used sessions when cache is full
 * - Automatic periodic cleanup
 * - Access tracking for LRU algorithm
 *
 * This fixes the critical memory leak issue identified in tier 3 analysis.
 */
export class ConversationStateManager {
  constructor(options = {}) {
    this.conversationStates = new Map();
    this.lastAccess = new Map(); // Track last access time for LRU
    this.maxSize = options.maxSize || 1000; // Max active sessions
    this.maxAge = options.maxAge || 3600000; // 1 hour TTL (in milliseconds)
    this.cleanupInterval = options.cleanupInterval || 60000; // Cleanup every minute

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Get conversation state
   * Updates last access time for LRU tracking
   */
  get(sessionId) {
    this.lastAccess.set(sessionId, Date.now());
    return this.conversationStates.get(sessionId);
  }

  /**
   * Set conversation state
   * Updates last access time and checks capacity
   */
  set(sessionId, state) {
    const now = Date.now();
    this.lastAccess.set(sessionId, now);
    this.conversationStates.set(sessionId, state);

    // Check if we need to evict sessions
    if (this.conversationStates.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Delete conversation state
   */
  delete(sessionId) {
    this.conversationStates.delete(sessionId);
    this.lastAccess.delete(sessionId);
  }

  /**
   * Check if session exists
   */
  has(sessionId) {
    return this.conversationStates.has(sessionId);
  }

  /**
   * Get all session IDs
   */
  keys() {
    return Array.from(this.conversationStates.keys());
  }

  /**
   * Get cache size
   */
  size() {
    return this.conversationStates.size;
  }

  /**
   * Start periodic cleanup timer
   */
  startPeriodicCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop periodic cleanup timer
   */
  stopPeriodicCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Cleanup stale sessions (TTL-based)
   */
  cleanup() {
    const now = Date.now();
    const toRemove = [];

    // Find sessions older than maxAge
    for (const [sessionId, lastAccess] of this.lastAccess.entries()) {
      const age = now - lastAccess;

      if (age > this.maxAge) {
        toRemove.push(sessionId);
      }
    }

    // Remove stale sessions
    for (const sessionId of toRemove) {
      this.delete(sessionId);
      console.log(`[Memory Cleanup] Removed stale session: ${sessionId}`);
    }

    // If still over max size, evict LRU
    if (this.conversationStates.size > this.maxSize) {
      this.evictLRU();
    }

    if (toRemove.length > 0) {
      console.log(
        `[Memory Cleanup] Removed ${toRemove.length} stale sessions. Cache size: ${this.conversationStates.size}`
      );
    }
  }

  /**
   * Evict least recently used session (LRU)
   */
  evictLRU() {
    if (this.conversationStates.size <= this.maxSize) {
      return; // No need to evict
    }

    // Sort by last access time and remove oldest
    const sorted = Array.from(this.lastAccess.entries()).sort(
      ([, a], [, b]) => a - b
    );

    const toEvict = sorted
      .slice(0, this.conversationStates.size - this.maxSize)
      .map(([sessionId]) => sessionId);

    for (const sessionId of toEvict) {
      this.delete(sessionId);
      console.log(`[Memory Cleanup] Evicted LRU session: ${sessionId}`);
    }

    console.log(
      `[Memory Cleanup] Evicted ${toEvict.length} LRU sessions. Cache size: ${this.conversationStates.size}`
    );
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const ages = Array.from(this.lastAccess.values()).map(
      (lastAccess) => now - lastAccess
    );

    return {
      size: this.conversationStates.size,
      maxSize: this.maxSize,
      averageAge:
        ages.length > 0
          ? ages.reduce((sum, age) => sum + age, 0) / ages.length
          : 0,
      oldestAge: ages.length > 0 ? Math.max(...ages) : 0,
      utilizationPercent: (this.conversationStates.size / this.maxSize) * 100,
    };
  }

  /**
   * Clear all sessions (use with caution)
   */
  clear() {
    this.conversationStates.clear();
    this.lastAccess.clear();
    console.log("[Memory Cleanup] Cleared all conversation states");
  }
}
