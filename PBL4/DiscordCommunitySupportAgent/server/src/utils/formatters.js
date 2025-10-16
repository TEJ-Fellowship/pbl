/**
 * Formatters - Utility functions for formatting responses and data
 */

/**
 * Format similarity score as percentage
 * @param {number} score - Similarity score (0-1)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatSimilarityScore(score, decimals = 1) {
  if (typeof score !== 'number' || isNaN(score)) {
    return '0.0%';
  }
  return `${(score * 100).toFixed(decimals)}%`;
}

/**
 * Format timestamp for display
 * @param {Date|string|number} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(timestamp) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add if truncated
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Format search results for display
 * @param {Array} results - Search results
 * @param {Object} options - Formatting options
 * @returns {Array} Formatted results
 */
export function formatSearchResults(results, options = {}) {
  const {
    includeScores = true,
    includeMetadata = true,
    maxContentLength = 200
  } = options;

  return results.map((result, index) => ({
    id: result.id || index,
    content: truncateText(result.content, maxContentLength),
    source: result.metadata?.source || result.source || 'Unknown',
    similarity: includeScores ? formatSimilarityScore(result.similarity) : null,
    metadata: includeMetadata ? result.metadata : null,
    scores: includeScores ? {
      semantic: formatSimilarityScore(result.semanticScore || 0),
      keyword: formatSimilarityScore(result.keywordScore || 0),
      combined: formatSimilarityScore(result.similarity || 0)
    } : null
  }));
}

/**
 * Format Discord-style markdown
 * @param {string} text - Text to format
 * @returns {string} Discord-formatted text
 */
export function formatDiscordMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    // Italic text
    .replace(/\*(.*?)\*/g, '*$1*')
    // Code blocks
    .replace(/`(.*?)`/g, '`$1`')
    // Code blocks with language
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '```$1\n$2```')
    // Strikethrough
    .replace(/~~(.*?)~~/g, '~~$1~~')
    // Underline
    .replace(/__(.*?)__/g, '__$1__')
    // Spoiler
    .replace(/\|\|(.*?)\|\|/g, '||$1||');
}

/**
 * Format server context for display
 * @param {Object} context - Server context
 * @returns {string} Formatted context string
 */
export function formatServerContext(context) {
  if (!context || typeof context !== 'object') {
    return 'General server';
  }

  const { type = 'general', size = 'unknown', purpose = 'community' } = context;
  
  const sizeText = size === 'unknown' ? '' : ` (${size} members)`;
  const purposeText = purpose === 'community' ? '' : ` - ${purpose}`;
  
  return `${type} server${sizeText}${purposeText}`;
}

/**
 * Format error message for user display
 * @param {Error|string} error - Error to format
 * @param {string} context - Error context
 * @returns {string} User-friendly error message
 */
export function formatErrorMessage(error, context = 'operation') {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const friendlyMessages = {
    'API key not valid': 'The AI service is currently unavailable. Please try again later.',
    'Search failed': 'I encountered an issue searching the knowledge base. Please try rephrasing your question.',
    'Network error': 'I\'m having trouble connecting to the service. Please check your connection and try again.',
    'Timeout': 'The request took too long to process. Please try again with a simpler question.'
  };

  // Check for specific error patterns
  for (const [pattern, message] of Object.entries(friendlyMessages)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  // Default fallback
  return `I encountered an issue with the ${context}. Please try again or contact support if the problem persists.`;
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || bytes < 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format duration for display
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(milliseconds) {
  if (typeof milliseconds !== 'number' || milliseconds < 0) {
    return '0ms';
  }

  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(1)}m`;
  }

  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}
