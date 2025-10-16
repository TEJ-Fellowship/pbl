const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from mcp-server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ===== API STATUS CHECKER COMPONENT =====
class ApiStatusChecker {
  constructor() {
    this.statusUrl = 'https://www.paypal.com/status';
    this.apiHealthUrl = 'https://api.paypal.com/v1/health';
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  // Check if query is asking about PayPal status
  isStatusQuery(query) {
    const lowerQuery = query.toLowerCase();
    const statusTriggers = [
      'down', 'outage', 'status', 'working', 'broken', 
      'not working', 'maintenance', 'incident', 'problem',
      'trouble', 'error', 'failed', 'unavailable', 'offline',
      'up', 'online', 'service', 'available'
    ];
    
    const statusPatterns = [
      /is paypal (down|working|up|offline|available)/i,
      /paypal (status|outage|maintenance|service)/i,
      /(paypal|paypal's).*(down|working|status|outage)/i,
      /(is|are).*(paypal|paypal's).*(down|working|up|offline)/i
    ];
    
    const hasTrigger = statusTriggers.some(trigger => lowerQuery.includes(trigger));
    const hasPattern = statusPatterns.some(pattern => pattern.test(query));
    
    return hasTrigger || hasPattern;
  }

  // Get cached status if available and not expired
  getCachedStatus() {
    const cached = this.cache.get('status');
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log('Using cached status data');
      return cached.data;
    }
    return null;
  }

  // Cache status data
  setCachedStatus(statusData) {
    this.cache.set('status', {
      data: statusData,
      timestamp: Date.now()
    });
  }

  // Parse status page HTML to extract status information
  parseStatusPage(html) {
    try {
      // Look for common status indicators in HTML
      const statusIndicators = {
        operational: /operational|all systems|green|up|running/i,
        degraded: /degraded|partial|yellow|slow|issues/i,
        outage: /outage|down|red|offline|unavailable|maintenance/i,
        maintenance: /maintenance|scheduled|planned/i
      };

      let overallStatus = 'unknown';
      let affectedServices = [];
      let lastUpdated = new Date().toISOString();

      // Check for overall status
      for (const [status, pattern] of Object.entries(statusIndicators)) {
        if (pattern.test(html)) {
          overallStatus = status;
          break;
        }
      }

      // Look for specific service mentions
      const servicePatterns = {
        payments: /payment|transaction|money/i,
        login: /login|authentication|sign.?in/i,
        api: /api|developer|integration/i,
        website: /website|web|site/i,
        mobile: /mobile|app|ios|android/i
      };

      for (const [service, pattern] of Object.entries(servicePatterns)) {
        if (pattern.test(html)) {
          affectedServices.push(service);
        }
      }

      // Look for timestamp information
      const timePattern = /(last updated|updated|as of).*?(\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i;
      const timeMatch = html.match(timePattern);
      if (timeMatch) {
        lastUpdated = timeMatch[0];
      }

      return {
        status: overallStatus,
        affectedServices: [...new Set(affectedServices)], // Remove duplicates
        lastUpdated,
        confidence: 'medium'
      };
    } catch (error) {
      console.error('Error parsing status page:', error.message);
      return {
        status: 'unknown',
        affectedServices: [],
        lastUpdated: new Date().toISOString(),
        confidence: 'low'
      };
    }
  }

  // Check PayPal API health endpoint
  async checkApiHealth() {
    try {
      console.log('Checking PayPal API health endpoint...');
      const response = await axios.get(this.apiHealthUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'PayPal-Support-Agent/1.0'
        }
      });

      if (response.status === 200) {
        return {
          status: 'operational',
          source: 'api',
          confidence: 'high'
        };
      }
    } catch (error) {
      console.log('API health endpoint not accessible:', error.message);
      return null;
    }
  }

  // Main method to check PayPal status
  async checkPayPalStatus() {
    try {
      console.log('Checking PayPal status...');

      // Check cache first
      const cached = this.getCachedStatus();
      if (cached) {
        return cached;
      }

      let statusData = {
        status: 'unknown',
        affectedServices: [],
        lastUpdated: new Date().toISOString(),
        confidence: 'low',
        source: 'unknown'
      };

      // Try API health endpoint first (most reliable)
      const apiHealth = await this.checkApiHealth();
      if (apiHealth) {
        statusData = {
          ...statusData,
          ...apiHealth,
          lastUpdated: new Date().toISOString()
        };
      } else {
        // Fallback to status page
        console.log('Checking PayPal status page...');
        const response = await axios.get(this.statusUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.status === 200) {
          const parsed = this.parseStatusPage(response.data);
          statusData = {
            ...statusData,
            ...parsed,
            source: 'status_page'
          };
        }
      }

      // Cache the result
      this.setCachedStatus(statusData);

      return statusData;

    } catch (error) {
      console.error('Error checking PayPal status:', error.message);
      
      // Return error status
      const errorStatus = {
        status: 'unknown',
        affectedServices: [],
        lastUpdated: new Date().toISOString(),
        confidence: 'low',
        source: 'error',
        error: error.message
      };

      // Cache error status for shorter time
      this.cache.set('status', {
        data: errorStatus,
        timestamp: Date.now() - (this.cacheTimeout - 10000) // Cache for only 10 seconds
      });

      return errorStatus;
    }
  }

  // Format status response for user
  formatStatusResponse(statusData) {
    const { status, affectedServices, lastUpdated, confidence, source } = statusData;

    let statusMessage = '';
    let statusEmoji = '';

    switch (status) {
      case 'operational':
        statusMessage = 'PayPal services are currently operational';
        statusEmoji = '✅';
        break;
      case 'degraded':
        statusMessage = 'PayPal is experiencing some issues but services are partially available';
        statusEmoji = '⚠️';
        break;
      case 'outage':
        statusMessage = 'PayPal is currently experiencing an outage';
        statusEmoji = '❌';
        break;
      case 'maintenance':
        statusMessage = 'PayPal is currently under maintenance';
        statusEmoji = '🔧';
        break;
      default:
        statusMessage = 'Unable to determine current PayPal status';
        statusEmoji = '❓';
    }

    let response = `${statusEmoji} **PayPal Status Update**\n\n${statusMessage}`;

    if (affectedServices.length > 0) {
      response += `\n\n**Affected Services:** ${affectedServices.join(', ')}`;
    }

    response += `\n\n**Last Updated:** ${lastUpdated}`;
    response += `\n**Source:** ${source === 'api' ? 'PayPal API' : 'PayPal Status Page'}`;
    response += `\n**Confidence:** ${confidence}`;

    if (status === 'unknown') {
      response += `\n\n*For the most current information, please check [PayPal's official status page](https://www.paypal.com/status) or contact PayPal support.*`;
    }

    return response;
  }

  // Get status with formatted response
  async getStatusResponse() {
    try {
      const statusData = await this.checkPayPalStatus();
      const formattedResponse = this.formatStatusResponse(statusData);
      
      return {
        success: true,
        statusData,
        message: formattedResponse
      };
    } catch (error) {
      console.error('Error getting status response:', error.message);
      return {
        success: false,
        message: 'Sorry, I encountered an error while checking PayPal\'s status. Please try again or check [PayPal\'s official status page](https://www.paypal.com/status).',
        error: error.message
      };
    }
  }
}

module.exports = ApiStatusChecker;
