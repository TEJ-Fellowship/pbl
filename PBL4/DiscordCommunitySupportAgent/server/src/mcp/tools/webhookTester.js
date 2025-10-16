import axios from 'axios';

/**
 * Discord Webhook Tester MCP Tool
 * Tests Discord webhook URLs and validates webhook functionality
 */
export class WebhookTesterTool {
  constructor() {
    this.name = 'discord_webhook_tester';
    this.description = 'Test Discord webhook URLs, validate webhook functionality, and debug webhook issues';
    this.discordWebhookBase = 'https://discord.com/api/webhooks';
  }

  /**
   * Test webhook URL
   * @param {string} webhookUrl - Discord webhook URL
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test result
   */
  async execute(webhookUrl, options = {}) {
    try {
      if (!webhookUrl) {
        return {
          success: false,
          error: 'Webhook URL is required'
        };
      }

      const {
        testMessage = 'Test message from Discord Support Agent',
        testEmbed = false,
        testFile = false,
        validateOnly = false
      } = options;

      // Validate webhook URL format
      const urlValidation = this.validateWebhookUrl(webhookUrl);
      if (!urlValidation.valid) {
        return {
          success: false,
          error: urlValidation.error,
          webhookUrl: this.sanitizeUrl(webhookUrl)
        };
      }

      if (validateOnly) {
        return {
          success: true,
          valid: true,
          webhookUrl: this.sanitizeUrl(webhookUrl),
          webhookInfo: urlValidation.info,
          message: 'Webhook URL format is valid'
        };
      }

      // Test webhook functionality
      const testResults = await this.testWebhookFunctionality(webhookUrl, {
        testMessage,
        testEmbed,
        testFile
      });

      return {
        success: true,
        valid: testResults.valid,
        webhookUrl: this.sanitizeUrl(webhookUrl),
        webhookInfo: urlValidation.info,
        testResults,
        recommendations: this.getWebhookRecommendations(testResults)
      };
    } catch (error) {
      return {
        success: false,
        error: `Webhook test failed: ${error.message}`,
        webhookUrl: this.sanitizeUrl(webhookUrl)
      };
    }
  }

  /**
   * Validate webhook URL format
   * @param {string} url - Webhook URL
   * @returns {Object} Validation result
   */
  validateWebhookUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a Discord webhook URL
      if (!urlObj.hostname.includes('discord.com') && !urlObj.hostname.includes('discordapp.com')) {
        return {
          valid: false,
          error: 'URL is not a Discord webhook URL'
        };
      }

      // Check if it contains webhook path
      if (!urlObj.pathname.includes('/webhooks/')) {
        return {
          valid: false,
          error: 'URL does not contain webhook path'
        };
      }

      // Extract webhook ID and token
      const pathParts = urlObj.pathname.split('/');
      const webhookIndex = pathParts.indexOf('webhooks');
      
      if (webhookIndex === -1 || pathParts.length < webhookIndex + 3) {
        return {
          valid: false,
          error: 'Invalid webhook URL format'
        };
      }

      const webhookId = pathParts[webhookIndex + 1];
      const webhookToken = pathParts[webhookIndex + 2];

      // Validate webhook ID and token format
      if (!webhookId || !webhookToken) {
        return {
          valid: false,
          error: 'Missing webhook ID or token'
        };
      }

      if (!/^\d+$/.test(webhookId)) {
        return {
          valid: false,
          error: 'Invalid webhook ID format'
        };
      }

      if (webhookToken.length < 20) {
        return {
          valid: false,
          error: 'Invalid webhook token format'
        };
      }

      return {
        valid: true,
        info: {
          webhookId,
          webhookToken: this.sanitizeToken(webhookToken),
          channelId: pathParts[webhookIndex - 1] || 'unknown',
          guildId: pathParts[webhookIndex - 2] || 'unknown'
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid URL format: ${error.message}`
      };
    }
  }

  /**
   * Test webhook functionality
   * @param {string} webhookUrl - Webhook URL
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test results
   */
  async testWebhookFunctionality(webhookUrl, options) {
    const results = {
      valid: false,
      tests: [],
      errors: [],
      responseTime: 0
    };

    const startTime = Date.now();

    try {
      // Test 1: Basic message
      const basicTest = await this.testBasicMessage(webhookUrl, options.testMessage);
      results.tests.push(basicTest);

      if (basicTest.success) {
        results.valid = true;
      }

      // Test 2: Embed message (if requested)
      if (options.testEmbed) {
        const embedTest = await this.testEmbedMessage(webhookUrl);
        results.tests.push(embedTest);
      }

      // Test 3: File upload (if requested)
      if (options.testFile) {
        const fileTest = await this.testFileUpload(webhookUrl);
        results.tests.push(fileTest);
      }

      results.responseTime = Date.now() - startTime;

    } catch (error) {
      results.errors.push({
        test: 'general',
        error: error.message
      });
    }

    return results;
  }

  /**
   * Test basic message sending
   * @param {string} webhookUrl - Webhook URL
   * @param {string} message - Test message
   * @returns {Promise<Object>} Test result
   */
  async testBasicMessage(webhookUrl, message) {
    try {
      const response = await axios.post(webhookUrl, {
        content: message,
        username: 'Discord Support Agent',
        avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        test: 'basic_message',
        success: true,
        statusCode: response.status,
        message: 'Basic message sent successfully',
        responseTime: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      return {
        test: 'basic_message',
        success: false,
        error: this.parseWebhookError(error),
        statusCode: error.response?.status || 'unknown'
      };
    }
  }

  /**
   * Test embed message sending
   * @param {string} webhookUrl - Webhook URL
   * @returns {Promise<Object>} Test result
   */
  async testEmbedMessage(webhookUrl) {
    try {
      const embed = {
        title: 'Discord Support Agent Test',
        description: 'This is a test embed message',
        color: 0x00ff00,
        fields: [
          {
            name: 'Test Field',
            value: 'This is a test field',
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Discord Support Agent'
        }
      };

      const response = await axios.post(webhookUrl, {
        embeds: [embed],
        username: 'Discord Support Agent'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        test: 'embed_message',
        success: true,
        statusCode: response.status,
        message: 'Embed message sent successfully'
      };
    } catch (error) {
      return {
        test: 'embed_message',
        success: false,
        error: this.parseWebhookError(error),
        statusCode: error.response?.status || 'unknown'
      };
    }
  }

  /**
   * Test file upload
   * @param {string} webhookUrl - Webhook URL
   * @returns {Promise<Object>} Test result
   */
  async testFileUpload(webhookUrl) {
    try {
      // Create a simple test file
      const testContent = 'This is a test file from Discord Support Agent';
      const blob = new Blob([testContent], { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', blob, 'test.txt');
      formData.append('content', 'Test file upload');

      const response = await axios.post(webhookUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 15000
      });

      return {
        test: 'file_upload',
        success: true,
        statusCode: response.status,
        message: 'File upload test successful'
      };
    } catch (error) {
      return {
        test: 'file_upload',
        success: false,
        error: this.parseWebhookError(error),
        statusCode: error.response?.status || 'unknown'
      };
    }
  }

  /**
   * Parse webhook error messages
   * @param {Error} error - Error object
   * @returns {string} Parsed error message
   */
  parseWebhookError(error) {
    if (error.response?.data) {
      const data = error.response.data;
      if (data.message) {
        return data.message;
      }
      if (data.code) {
        return `Discord API Error ${data.code}: ${data.message || 'Unknown error'}`;
      }
    }

    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused - webhook URL may be invalid';
    }

    if (error.code === 'ENOTFOUND') {
      return 'Domain not found - check webhook URL';
    }

    if (error.code === 'ETIMEDOUT') {
      return 'Request timeout - webhook may be slow or unresponsive';
    }

    return error.message || 'Unknown error occurred';
  }

  /**
   * Get webhook recommendations
   * @param {Object} testResults - Test results
   * @returns {Array} Recommendations
   */
  getWebhookRecommendations(testResults) {
    const recommendations = [];

    if (!testResults.valid) {
      recommendations.push({
        type: 'error',
        message: 'Webhook is not functioning properly',
        action: 'Check webhook URL and permissions'
      });
    }

    if (testResults.responseTime > 5000) {
      recommendations.push({
        type: 'warning',
        message: 'Webhook response time is slow',
        action: 'Consider optimizing webhook payload or checking server performance'
      });
    }

    const failedTests = testResults.tests.filter(test => !test.success);
    if (failedTests.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${failedTests.length} test(s) failed`,
        action: 'Review webhook configuration and permissions'
      });
    }

    if (testResults.valid) {
      recommendations.push({
        type: 'success',
        message: 'Webhook is working correctly',
        action: 'You can use this webhook for your Discord integrations'
      });
    }

    return recommendations;
  }

  /**
   * Sanitize webhook URL for logging
   * @param {string} url - Webhook URL
   * @returns {string} Sanitized URL
   */
  sanitizeUrl(url) {
    if (!url) return 'N/A';
    
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const webhookIndex = pathParts.indexOf('webhooks');
      
      if (webhookIndex !== -1 && pathParts.length > webhookIndex + 2) {
        pathParts[webhookIndex + 2] = '*'.repeat(pathParts[webhookIndex + 2].length);
      }
      
      return `${urlObj.protocol}//${urlObj.hostname}${pathParts.join('/')}`;
    } catch (error) {
      return '*'.repeat(url.length);
    }
  }

  /**
   * Sanitize token for logging
   * @param {string} token - Token to sanitize
   * @returns {string} Sanitized token
   */
  sanitizeToken(token) {
    if (!token) return 'N/A';
    return token.substring(0, 8) + '*'.repeat(token.length - 8);
  }

  /**
   * Get tool metadata
   * @returns {Object} Tool metadata
   */
  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          webhookUrl: {
            type: 'string',
            description: 'Discord webhook URL to test'
          },
          testMessage: {
            type: 'string',
            description: 'Test message to send (default: "Test message from Discord Support Agent")',
            default: 'Test message from Discord Support Agent'
          },
          testEmbed: {
            type: 'boolean',
            description: 'Whether to test embed messages (default: false)',
            default: false
          },
          testFile: {
            type: 'boolean',
            description: 'Whether to test file uploads (default: false)',
            default: false
          },
          validateOnly: {
            type: 'boolean',
            description: 'Only validate URL format without sending messages (default: false)',
            default: false
          }
        },
        required: ['webhookUrl']
      }
    };
  }
}

export default WebhookTesterTool;
