import axios from 'axios';

/**
 * Discord Bot Token Validator MCP Tool
 * Validates Discord bot tokens and checks their permissions/scopes
 */
export class BotTokenValidatorTool {
  constructor() {
    this.name = 'discord_bot_token_validator';
    this.description = 'Validate Discord bot tokens, check permissions, and verify token status';
    this.discordApiBase = 'https://discord.com/api/v10';
  }

  /**
   * Execute bot token validator tool
   * @param {Object} options - Tool options
   * @returns {Promise<Object>} Execution result
   */
  async execute(options = {}) {
    try {
      const { token } = options;

      if (!token) {
        return {
          success: false,
          error: 'Token is required for bot token validation'
        };
      }

      return await this.validateToken(token);
    } catch (error) {
      return {
        success: false,
        error: `Bot token validator execution failed: ${error.message}`
      };
    }
  }

  /**
   * Validate bot token
   * @param {string} token - Discord bot token
   * @returns {Promise<Object>} Validation result
   */
  async validateToken(token) {
    try {
      if (!token) {
        return {
          success: false,
          error: 'Token is required'
        };
      }

      // Sanitize token for logging (hide sensitive parts)
      const sanitizedToken = this.sanitizeToken(token);

      // Validate token format
      const formatValidation = this.validateTokenFormat(token);
      if (!formatValidation.valid) {
        return {
          success: false,
          error: formatValidation.error,
          sanitizedToken
        };
      }

      // Test token with Discord API
      const apiValidation = await this.testTokenWithAPI(token);
      
      return {
        success: true,
        valid: apiValidation.valid,
        sanitizedToken,
        botInfo: apiValidation.botInfo,
        permissions: apiValidation.permissions,
        scopes: apiValidation.scopes,
        warnings: apiValidation.warnings,
        recommendations: apiValidation.recommendations
      };
    } catch (error) {
      return {
        success: false,
        error: `Token validation failed: ${error.message}`,
        sanitizedToken: this.sanitizeToken(token)
      };
    }
  }

  /**
   * Validate token format
   * @param {string} token - Discord bot token
   * @returns {Object} Format validation result
   */
  validateTokenFormat(token) {
    // Discord bot tokens typically follow this format:
    // [bot_id].[timestamp].[hmac_signature]
    const tokenPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
    
    if (!tokenPattern.test(token)) {
      return {
        valid: false,
        error: 'Invalid token format. Discord bot tokens should be in format: bot_id.timestamp.signature'
      };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        valid: false,
        error: 'Token must have exactly 3 parts separated by dots'
      };
    }

    // Check if first part looks like a bot ID (numeric)
    const botId = parts[0];
    if (!/^\d+$/.test(botId)) {
      return {
        valid: false,
        error: 'First part of token should be a numeric bot ID'
      };
    }

    return {
      valid: true,
      botId: botId
    };
  }

  /**
   * Test token with Discord API
   * @param {string} token - Discord bot token
   * @returns {Promise<Object>} API validation result
   */
  async testTokenWithAPI(token) {
    try {
      // Get bot information
      const botResponse = await axios.get(`${this.discordApiBase}/users/@me`, {
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const botInfo = botResponse.data;

      // Get bot's permissions in guilds (if any)
      const permissions = await this.getBotPermissions(token, botInfo.id);

      // Analyze token security
      const securityAnalysis = this.analyzeTokenSecurity(token, botInfo);

      return {
        valid: true,
        botInfo: {
          id: botInfo.id,
          username: botInfo.username,
          discriminator: botInfo.discriminator,
          avatar: botInfo.avatar,
          bot: botInfo.bot,
          verified: botInfo.verified,
          created_at: botInfo.created_at
        },
        permissions,
        scopes: this.detectTokenScopes(token),
        warnings: securityAnalysis.warnings,
        recommendations: securityAnalysis.recommendations
      };
    } catch (error) {
      if (error.response?.status === 401) {
        return {
          valid: false,
          error: 'Invalid token - unauthorized access'
        };
      } else if (error.response?.status === 403) {
        return {
          valid: false,
          error: 'Token is valid but lacks required permissions'
        };
      } else {
        return {
          valid: false,
          error: `API error: ${error.message}`
        };
      }
    }
  }

  /**
   * Get bot permissions in guilds
   * @param {string} token - Discord bot token
   * @param {string} botId - Bot ID
   * @returns {Promise<Object>} Permissions info
   */
  async getBotPermissions(token, botId) {
    try {
      const guildsResponse = await axios.get(`${this.discordApiBase}/users/@me/guilds`, {
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const guilds = guildsResponse.data;
      const permissions = [];

      // Get permissions for each guild
      for (const guild of guilds.slice(0, 5)) { // Limit to first 5 guilds
        try {
          const guildResponse = await axios.get(`${this.discordApiBase}/guilds/${guild.id}`, {
            headers: {
              'Authorization': `Bot ${token}`,
              'Content-Type': 'application/json'
            }
          });

          permissions.push({
            guildId: guild.id,
            guildName: guild.name,
            permissions: guild.permissions,
            owner: guild.owner
          });
        } catch (error) {
          // Skip guilds where we can't get permissions
          continue;
        }
      }

      return {
        guildCount: guilds.length,
        permissions
      };
    } catch (error) {
      return {
        guildCount: 0,
        permissions: [],
        error: 'Could not fetch guild permissions'
      };
    }
  }

  /**
   * Detect token scopes
   * @param {string} token - Discord bot token
   * @returns {Array} Detected scopes
   */
  detectTokenScopes(token) {
    // This is a simplified scope detection
    // In reality, scopes are determined during OAuth2 flow
    const commonScopes = [
      'bot',
      'applications.commands',
      'identify',
      'guilds',
      'guilds.join',
      'guilds.members.read'
    ];

    return commonScopes; // Default scopes for bot tokens
  }

  /**
   * Analyze token security
   * @param {string} token - Discord bot token
   * @param {Object} botInfo - Bot information
   * @returns {Object} Security analysis
   */
  analyzeTokenSecurity(token, botInfo) {
    const warnings = [];
    const recommendations = [];

    // Check if bot is verified
    if (!botInfo.verified) {
      warnings.push({
        type: 'warning',
        message: 'Bot is not verified by Discord',
        severity: 'medium'
      });
    }

    // Check token age (if we can determine it)
    const tokenParts = token.split('.');
    if (tokenParts.length >= 2) {
      try {
        const timestamp = parseInt(tokenParts[1], 36);
        const tokenAge = Date.now() - timestamp;
        const daysOld = tokenAge / (1000 * 60 * 60 * 24);

        if (daysOld > 365) {
          warnings.push({
            type: 'warning',
            message: `Token is ${Math.floor(daysOld)} days old`,
            severity: 'low'
          });
          recommendations.push({
            type: 'recommendation',
            message: 'Consider regenerating the token for better security'
          });
        }
      } catch (error) {
        // Ignore timestamp parsing errors
      }
    }

    // General security recommendations
    recommendations.push(
      {
        type: 'recommendation',
        message: 'Store the token securely in environment variables'
      },
      {
        type: 'recommendation',
        message: 'Never commit the token to version control'
      },
      {
        type: 'recommendation',
        message: 'Use the minimum required permissions for your bot'
      }
    );

    return {
      warnings,
      recommendations
    };
  }

  /**
   * Sanitize token for logging
   * @param {string} token - Discord bot token
   * @returns {string} Sanitized token
   */
  sanitizeToken(token) {
    if (!token) return 'N/A';
    
    const parts = token.split('.');
    if (parts.length >= 3) {
      return `${parts[0]}.${'*'.repeat(parts[1].length)}.${'*'.repeat(parts[2].length)}`;
    }
    
    return '*'.repeat(token.length);
  }

  /**
   * Check if token is a user token (not bot token)
   * @param {string} token - Token to check
   * @returns {boolean} True if appears to be user token
   */
  isUserToken(token) {
    // User tokens are typically longer and have different format
    // This is a heuristic check
    return token.length > 50 && !token.includes('.');
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
          token: {
            type: 'string',
            description: 'Discord bot token to validate'
          }
        },
        required: ['token']
      }
    };
  }
}

export default BotTokenValidatorTool;
