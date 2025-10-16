/**
 * Discord Permission Calculator MCP Tool
 * Handles Discord permission bitfield calculations and validation
 */
export class PermissionCalculatorTool {
  constructor() {
    this.name = 'discord_permission_calculator';
    this.description = 'Calculate Discord permission bitfields, validate permissions, and explain permission combinations';
    
    // Discord permission constants (bitfield values)
    this.permissions = {
      CREATE_INSTANT_INVITE: 1n << 0n,
      KICK_MEMBERS: 1n << 1n,
      BAN_MEMBERS: 1n << 2n,
      ADMINISTRATOR: 1n << 3n,
      MANAGE_CHANNELS: 1n << 4n,
      MANAGE_GUILD: 1n << 5n,
      ADD_REACTIONS: 1n << 6n,
      VIEW_AUDIT_LOG: 1n << 7n,
      PRIORITY_SPEAKER: 1n << 8n,
      STREAM: 1n << 9n,
      VIEW_CHANNEL: 1n << 10n,
      SEND_MESSAGES: 1n << 11n,
      SEND_TTS_MESSAGES: 1n << 12n,
      MANAGE_MESSAGES: 1n << 13n,
      EMBED_LINKS: 1n << 14n,
      ATTACH_FILES: 1n << 15n,
      READ_MESSAGE_HISTORY: 1n << 16n,
      MENTION_EVERYONE: 1n << 17n,
      USE_EXTERNAL_EMOJIS: 1n << 18n,
      VIEW_GUILD_INSIGHTS: 1n << 19n,
      CONNECT: 1n << 20n,
      SPEAK: 1n << 21n,
      MUTE_MEMBERS: 1n << 22n,
      DEAFEN_MEMBERS: 1n << 23n,
      MOVE_MEMBERS: 1n << 24n,
      USE_VAD: 1n << 25n,
      CHANGE_NICKNAME: 1n << 26n,
      MANAGE_NICKNAMES: 1n << 27n,
      MANAGE_ROLES: 1n << 28n,
      MANAGE_WEBHOOKS: 1n << 29n,
      MANAGE_EMOJIS_AND_STICKERS: 1n << 30n,
      USE_APPLICATION_COMMANDS: 1n << 31n,
      REQUEST_TO_SPEAK: 1n << 32n,
      MANAGE_EVENTS: 1n << 33n,
      MANAGE_THREADS: 1n << 34n,
      CREATE_PUBLIC_THREADS: 1n << 35n,
      CREATE_PRIVATE_THREADS: 1n << 36n,
      USE_EXTERNAL_STICKERS: 1n << 37n,
      SEND_MESSAGES_IN_THREADS: 1n << 38n,
      USE_EMBEDDED_ACTIVITIES: 1n << 39n,
      MODERATE_MEMBERS: 1n << 40n,
      VIEW_CREATOR_MONETIZATION_ANALYTICS: 1n << 41n,
      USE_SOUNDBOARD: 1n << 42n,
      CREATE_EXPRESSIONS: 1n << 43n,
      CREATE_EVENTS: 1n << 44n,
      USE_EXTERNAL_SOUNDS: 1n << 45n,
      SEND_VOICE_MESSAGES: 1n << 46n
    };

    // Permission categories for better organization
    this.permissionCategories = {
      'Administrative': [
        'ADMINISTRATOR', 'MANAGE_GUILD', 'MANAGE_CHANNELS', 'MANAGE_ROLES',
        'MANAGE_WEBHOOKS', 'MANAGE_EMOJIS_AND_STICKERS', 'VIEW_AUDIT_LOG',
        'VIEW_GUILD_INSIGHTS', 'MANAGE_EVENTS', 'MANAGE_THREADS'
      ],
      'Moderation': [
        'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_MESSAGES', 'MUTE_MEMBERS',
        'DEAFEN_MEMBERS', 'MODERATE_MEMBERS'
      ],
      'Text Channel': [
        'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS',
        'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE',
        'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS', 'SEND_MESSAGES_IN_THREADS',
        'CREATE_PUBLIC_THREADS', 'CREATE_PRIVATE_THREADS', 'SEND_VOICE_MESSAGES'
      ],
      'Voice Channel': [
        'CONNECT', 'SPEAK', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS',
        'USE_VAD', 'PRIORITY_SPEAKER', 'STREAM', 'USE_SOUNDBOARD',
        'USE_EXTERNAL_SOUNDS'
      ],
      'General': [
        'VIEW_CHANNEL', 'CREATE_INSTANT_INVITE', 'CHANGE_NICKNAME',
        'MANAGE_NICKNAMES', 'USE_APPLICATION_COMMANDS', 'REQUEST_TO_SPEAK',
        'USE_EMBEDDED_ACTIVITIES', 'CREATE_EXPRESSIONS', 'CREATE_EVENTS'
      ]
    };
  }

  /**
   * Calculate permission bitfield from permission names
   * @param {Array<string>} permissionNames - Array of permission names
   * @returns {Object} Calculation result
   */
  async calculatePermissions(permissionNames) {
    try {
      const permissions = permissionNames.map(name => name.toUpperCase());
      const invalidPermissions = permissions.filter(name => !this.permissions[name]);
      
      if (invalidPermissions.length > 0) {
        return {
          success: false,
          error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
          validPermissions: Object.keys(this.permissions)
        };
      }

      let bitfield = 0n;
      const calculatedPermissions = [];

      permissions.forEach(permission => {
        bitfield |= this.permissions[permission];
        calculatedPermissions.push({
          name: permission,
          value: this.permissions[permission].toString(),
          description: this.getPermissionDescription(permission)
        });
      });

      return {
        success: true,
        bitfield: bitfield.toString(),
        permissions: calculatedPermissions,
        categories: this.categorizePermissions(calculatedPermissions),
        warnings: this.getPermissionWarnings(calculatedPermissions)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse permission bitfield to permission names
   * @param {string} bitfield - Permission bitfield as string
   * @returns {Object} Parsing result
   */
  async parseBitfield(bitfield) {
    try {
      const bitfieldBigInt = BigInt(bitfield);
      const permissions = [];

      Object.entries(this.permissions).forEach(([name, value]) => {
        if ((bitfieldBigInt & value) === value) {
          permissions.push({
            name,
            value: value.toString(),
            description: this.getPermissionDescription(name)
          });
        }
      });

      return {
        success: true,
        bitfield: bitfield,
        permissions,
        categories: this.categorizePermissions(permissions),
        warnings: this.getPermissionWarnings(permissions)
      };
    } catch (error) {
      return {
        success: false,
        error: `Invalid bitfield: ${error.message}`
      };
    }
  }

  /**
   * Validate permission combination
   * @param {Array<string>} permissions - Permission names to validate
   * @returns {Object} Validation result
   */
  async validatePermissions(permissions) {
    try {
      const result = await this.calculatePermissions(permissions);
      
      if (!result.success) {
        return result;
      }

      const warnings = result.warnings || [];
      const conflicts = this.checkPermissionConflicts(result.permissions);
      const recommendations = this.getPermissionRecommendations(result.permissions);

      return {
        success: true,
        valid: warnings.length === 0 && conflicts.length === 0,
        permissions: result.permissions,
        warnings: [...warnings, ...conflicts],
        recommendations,
        categories: result.categories
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get permission description
   * @param {string} permission - Permission name
   * @returns {string} Permission description
   */
  getPermissionDescription(permission) {
    const descriptions = {
      'CREATE_INSTANT_INVITE': 'Create instant invites to the server',
      'KICK_MEMBERS': 'Kick members from the server',
      'BAN_MEMBERS': 'Ban members from the server',
      'ADMINISTRATOR': 'Administrator access (bypasses all permission checks)',
      'MANAGE_CHANNELS': 'Create, edit, or delete channels',
      'MANAGE_GUILD': 'Edit server name and change region',
      'ADD_REACTIONS': 'Add reactions to messages',
      'VIEW_AUDIT_LOG': 'View the server audit log',
      'PRIORITY_SPEAKER': 'Use priority speaker in voice channels',
      'STREAM': 'Stream in voice channels',
      'VIEW_CHANNEL': 'View channels',
      'SEND_MESSAGES': 'Send messages in text channels',
      'SEND_TTS_MESSAGES': 'Send text-to-speech messages',
      'MANAGE_MESSAGES': 'Delete messages by other members',
      'EMBED_LINKS': 'Embed links in messages',
      'ATTACH_FILES': 'Attach files to messages',
      'READ_MESSAGE_HISTORY': 'Read message history',
      'MENTION_EVERYONE': 'Mention @everyone and @here',
      'USE_EXTERNAL_EMOJIS': 'Use external emojis from other servers',
      'VIEW_GUILD_INSIGHTS': 'View server insights',
      'CONNECT': 'Connect to voice channels',
      'SPEAK': 'Speak in voice channels',
      'MUTE_MEMBERS': 'Mute other members in voice channels',
      'DEAFEN_MEMBERS': 'Deafen other members in voice channels',
      'MOVE_MEMBERS': 'Move members between voice channels',
      'USE_VAD': 'Use voice activity detection',
      'CHANGE_NICKNAME': 'Change own nickname',
      'MANAGE_NICKNAMES': 'Change other members\' nicknames',
      'MANAGE_ROLES': 'Create, edit, or delete roles',
      'MANAGE_WEBHOOKS': 'Create, edit, or delete webhooks',
      'MANAGE_EMOJIS_AND_STICKERS': 'Manage emojis and stickers',
      'USE_APPLICATION_COMMANDS': 'Use slash commands',
      'REQUEST_TO_SPEAK': 'Request to speak in stage channels',
      'MANAGE_EVENTS': 'Manage server events',
      'MANAGE_THREADS': 'Manage threads',
      'CREATE_PUBLIC_THREADS': 'Create public threads',
      'CREATE_PRIVATE_THREADS': 'Create private threads',
      'USE_EXTERNAL_STICKERS': 'Use external stickers',
      'SEND_MESSAGES_IN_THREADS': 'Send messages in threads',
      'USE_EMBEDDED_ACTIVITIES': 'Use embedded activities',
      'MODERATE_MEMBERS': 'Moderate members',
      'VIEW_CREATOR_MONETIZATION_ANALYTICS': 'View creator monetization analytics',
      'USE_SOUNDBOARD': 'Use soundboard',
      'CREATE_EXPRESSIONS': 'Create expressions',
      'CREATE_EVENTS': 'Create events',
      'USE_EXTERNAL_SOUNDS': 'Use external sounds',
      'SEND_VOICE_MESSAGES': 'Send voice messages'
    };

    return descriptions[permission] || 'Unknown permission';
  }

  /**
   * Categorize permissions
   * @param {Array} permissions - Array of permission objects
   * @returns {Object} Categorized permissions
   */
  categorizePermissions(permissions) {
    const categories = {};
    
    Object.entries(this.permissionCategories).forEach(([category, categoryPermissions]) => {
      const categoryPerms = permissions.filter(perm => 
        categoryPermissions.includes(perm.name)
      );
      
      if (categoryPerms.length > 0) {
        categories[category] = categoryPerms;
      }
    });

    return categories;
  }

  /**
   * Get permission warnings
   * @param {Array} permissions - Array of permission objects
   * @returns {Array} Array of warnings
   */
  getPermissionWarnings(permissions) {
    const warnings = [];
    const permissionNames = permissions.map(p => p.name);

    // Administrator warning
    if (permissionNames.includes('ADMINISTRATOR')) {
      warnings.push({
        type: 'warning',
        message: 'ADMINISTRATOR permission grants all permissions and bypasses all permission checks',
        severity: 'high'
      });
    }

    // Dangerous permission combinations
    if (permissionNames.includes('MANAGE_ROLES') && permissionNames.includes('ADMINISTRATOR')) {
      warnings.push({
        type: 'warning',
        message: 'MANAGE_ROLES is redundant when ADMINISTRATOR is present',
        severity: 'medium'
      });
    }

    return warnings;
  }

  /**
   * Check for permission conflicts
   * @param {Array} permissions - Array of permission objects
   * @returns {Array} Array of conflicts
   */
  checkPermissionConflicts(permissions) {
    const conflicts = [];
    const permissionNames = permissions.map(p => p.name);

    // Check for conflicting permissions
    if (permissionNames.includes('ADMINISTRATOR')) {
      const redundantPermissions = permissionNames.filter(name => name !== 'ADMINISTRATOR');
      if (redundantPermissions.length > 0) {
        conflicts.push({
          type: 'conflict',
          message: `ADMINISTRATOR permission makes these permissions redundant: ${redundantPermissions.join(', ')}`,
          severity: 'medium'
        });
      }
    }

    return conflicts;
  }

  /**
   * Get permission recommendations
   * @param {Array} permissions - Array of permission objects
   * @returns {Array} Array of recommendations
   */
  getPermissionRecommendations(permissions) {
    const recommendations = [];
    const permissionNames = permissions.map(p => p.name);

    // Common permission sets
    if (permissionNames.includes('MANAGE_MESSAGES') && !permissionNames.includes('READ_MESSAGE_HISTORY')) {
      recommendations.push({
        type: 'recommendation',
        message: 'Consider adding READ_MESSAGE_HISTORY permission when using MANAGE_MESSAGES',
        reason: 'You need to read messages to effectively manage them'
      });
    }

    if (permissionNames.includes('KICK_MEMBERS') && !permissionNames.includes('VIEW_AUDIT_LOG')) {
      recommendations.push({
        type: 'recommendation',
        message: 'Consider adding VIEW_AUDIT_LOG permission when using KICK_MEMBERS',
        reason: 'Audit logs help track moderation actions'
      });
    }

    return recommendations;
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
          action: {
            type: 'string',
            enum: ['calculate', 'parse', 'validate'],
            description: 'Action to perform: calculate permissions, parse bitfield, or validate permissions'
          },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of permission names (for calculate and validate actions)'
          },
          bitfield: {
            type: 'string',
            description: 'Permission bitfield as string (for parse action)'
          }
        },
        required: ['action']
      }
    };
  }
}

export default PermissionCalculatorTool;
