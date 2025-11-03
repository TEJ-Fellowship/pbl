/**
 * Validators - Utility functions for input validation and sanitization
 */

/**
 * Validate search query
 * @param {string} query - Query to validate
 * @returns {Object} Validation result
 */
export function validateQuery(query) {
  const result = {
    isValid: false,
    error: null,
    sanitized: null
  };

  if (!query) {
    result.error = 'Query is required';
    return result;
  }

  if (typeof query !== 'string') {
    result.error = 'Query must be a string';
    return result;
  }

  // Sanitize query
  const sanitized = query.trim();
  
  if (sanitized.length === 0) {
    result.error = 'Query cannot be empty';
    return result;
  }

  if (sanitized.length > 1000) {
    result.error = 'Query is too long (max 1000 characters)';
    return result;
  }

  // Check for potentially malicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /function\s*\(/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      result.error = 'Query contains potentially harmful content';
      return result;
    }
  }

  result.isValid = true;
  result.sanitized = sanitized;
  return result;
}

/**
 * Validate server context
 * @param {Object} context - Server context to validate
 * @returns {Object} Validation result
 */
export function validateServerContext(context) {
  const result = {
    isValid: false,
    error: null,
    sanitized: null
  };

  if (!context || typeof context !== 'object') {
    result.sanitized = {
      type: 'general',
      size: 'unknown',
      purpose: 'community'
    };
    result.isValid = true;
    return result;
  }

  const validTypes = ['general', 'gaming', 'study', 'community', 'business', 'education'];
  const validSizes = ['unknown', 'small', 'medium', 'large', 'huge'];
  const validPurposes = ['community', 'gaming', 'study', 'business', 'education', 'support'];

  const sanitized = {
    type: validTypes.includes(context.type) ? context.type : 'general',
    size: validSizes.includes(context.size) ? context.size : 'unknown',
    purpose: validPurposes.includes(context.purpose) ? context.purpose : 'community'
  };

  result.isValid = true;
  result.sanitized = sanitized;
  return result;
}

/**
 * Validate search options
 * @param {Object} options - Search options to validate
 * @returns {Object} Validation result
 */
export function validateSearchOptions(options) {
  const result = {
    isValid: false,
    error: null,
    sanitized: null
  };

  if (!options || typeof options !== 'object') {
    result.sanitized = {
      method: 'hybrid',
      limit: 5,
      semanticWeight: 0.65,
      keywordWeight: 0.35,
      enableReranking: false
    };
    result.isValid = true;
    return result;
  }

  const validMethods = ['semantic', 'keyword', 'hybrid'];
  const sanitized = {
    method: validMethods.includes(options.method) ? options.method : 'hybrid',
    limit: Math.max(1, Math.min(20, parseInt(options.limit) || 5)),
    semanticWeight: Math.max(0, Math.min(1, parseFloat(options.semanticWeight) || 0.65)),
    keywordWeight: Math.max(0, Math.min(1, parseFloat(options.keywordWeight) || 0.35)),
    enableReranking: Boolean(options.enableReranking)
  };

  // Ensure weights sum to 1.0
  const totalWeight = sanitized.semanticWeight + sanitized.keywordWeight;
  if (totalWeight > 0) {
    sanitized.semanticWeight = sanitized.semanticWeight / totalWeight;
    sanitized.keywordWeight = sanitized.keywordWeight / totalWeight;
  }

  result.isValid = true;
  result.sanitized = sanitized;
  return result;
}

/**
 * Validate session ID
 * @param {string} sessionId - Session ID to validate
 * @returns {Object} Validation result
 */
export function validateServerId(serverId) {
  const result = {
    isValid: false,
    error: null,
    sanitized: null
  };

  if (!serverId) {
    result.error = 'Server ID is required';
    return result;
  }

  if (typeof serverId !== 'string') {
    result.error = 'Server ID must be a string';
    return result;
  }

  // Sanitize server ID
  const sanitized = serverId.trim();
  
  if (sanitized.length === 0) {
    result.error = 'Server ID cannot be empty';
    return result;
  }

  if (sanitized.length > 100) {
    result.error = 'Server ID is too long (max 100 characters)';
    return result;
  }

  // Check for potentially malicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /[<>{}[\]]/i  // Brackets
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      result.error = 'Server ID contains potentially harmful content';
      return result;
    }
  }

  result.isValid = true;
  result.sanitized = sanitized;
  return result;
}

// Alias for backward compatibility (deprecated)
export function validateSessionId(sessionId) {
  const result = {
    isValid: false,
    error: null,
    sanitized: null
  };

  if (!sessionId) {
    result.sanitized = 'default';
    result.isValid = true;
    return result;
  }

  if (typeof sessionId !== 'string') {
    result.error = 'Session ID must be a string';
    return result;
  }

  const sanitized = sessionId.trim();
  
  if (sanitized.length === 0) {
    result.sanitized = 'default';
    result.isValid = true;
    return result;
  }

  if (sanitized.length > 100) {
    result.error = 'Session ID is too long (max 100 characters)';
    return result;
  }

  // Check for valid characters (alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    result.error = 'Session ID contains invalid characters';
    return result;
  }

  result.isValid = true;
  result.sanitized = sanitized;
  return result;
}

/**
 * Sanitize HTML content
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized content
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid URL
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate numeric range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} Is in valid range
 */
export function isInRange(value, min, max) {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  return value >= min && value <= max;
}

/**
 * Sanitize filename
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 255);
}
