const fs = require('fs');
const path = require('path');

// ===== CACHE SERVICE =====
class CacheService {
  constructor() {
    this.cache = new Map();
    this.cacheFile = path.join(__dirname, '../../cache/exchange_rates.json');
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.maxCacheSize = 1000; // Maximum number of cached items
    
    // Ensure cache directory exists
    this.ensureCacheDirectory();
    
    // Load existing cache from file
    this.loadCacheFromFile();
    
    // Clean expired entries every 10 minutes
    setInterval(() => this.cleanExpiredEntries(), 10 * 60 * 1000);
  }

  // Ensure cache directory exists
  ensureCacheDirectory() {
    const cacheDir = path.dirname(this.cacheFile);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  }

  // Load cache from file on startup
  loadCacheFromFile() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        const cacheData = JSON.parse(data);
        
        // Convert timestamps back to numbers and load into Map
        for (const [key, value] of Object.entries(cacheData)) {
          this.cache.set(key, {
            ...value,
            timestamp: new Date(value.timestamp).getTime()
          });
        }
        
        console.log(`Loaded ${this.cache.size} cached exchange rates from file`);
      }
    } catch (error) {
      console.warn('Could not load cache from file:', error.message);
    }
  }

  // Save cache to file
  saveCacheToFile() {
    try {
      const cacheData = {};
      for (const [key, value] of this.cache.entries()) {
        cacheData[key] = {
          ...value,
          timestamp: new Date(value.timestamp).toISOString()
        };
      }
      
      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.warn('⚠️ Could not save cache to file:', error.message);
    }
  }

  // Generate cache key
  generateKey(fromCurrency, toCurrency) {
    return `${fromCurrency.toUpperCase()}_${toCurrency.toUpperCase()}`;
  }

  // Get cached data
  get(fromCurrency, toCurrency) {
    const key = this.generateKey(fromCurrency, toCurrency);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`💾 Cache hit for ${fromCurrency} to ${toCurrency}`);
    return cached.data;
  }

  // Set cached data
  set(fromCurrency, toCurrency, data) {
    const key = this.generateKey(fromCurrency, toCurrency);
    
    // Check cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanOldestEntries();
    }
    
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    
    console.log(`💾 Cached exchange rate for ${fromCurrency} to ${toCurrency}`);
    
    // Save to file (async, don't block)
    setImmediate(() => this.saveCacheToFile());
  }

  // Clean expired entries
  cleanExpiredEntries() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired cache entries`);
      this.saveCacheToFile();
    }
  }

  // Clean oldest entries when cache is full
  cleanOldestEntries() {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 20% of entries
    const toRemove = Math.floor(this.maxCacheSize * 0.2);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
    
    console.log(`Cleaned ${toRemove} oldest cache entries`);
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;
    
    for (const value of this.cache.values()) {
      if (now - value.timestamp > this.cacheExpiry) {
        expired++;
      } else {
        valid++;
      }
    }
    
    return {
      total: this.cache.size,
      valid: valid,
      expired: expired,
      maxSize: this.maxCacheSize,
      expiryMinutes: this.cacheExpiry / (60 * 1000)
    };
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
      }
    } catch (error) {
      console.warn('Could not delete cache file:', error.message);
    }
    console.log('Cache cleared');
  }

  // Get cache hit rate (if you want to track performance)
  getHitRate() {
    // This would need to be implemented with counters
    // For now, just return basic stats
    return this.getStats();
  }
}

module.exports = CacheService;
