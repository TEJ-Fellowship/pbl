/**
 * Discord Role Hierarchy Checker MCP Tool
 * Validates Discord role hierarchy and permission management
 */
export class RoleHierarchyCheckerTool {
  constructor() {
    this.name = 'discord_role_hierarchy_checker';
    this.description = 'Validate Discord role hierarchy, check permission conflicts, and provide role management recommendations';
    
    // Discord permission constants
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
  }

  /**
   * Check role hierarchy
   * @param {Array} roles - Array of role objects
   * @param {Object} options - Check options
   * @returns {Promise<Object>} Hierarchy check result
   */
  async execute(roles, options = {}) {
    try {
      if (!roles || !Array.isArray(roles)) {
        return {
          success: false,
          error: 'Roles array is required'
        };
      }

      const {
        checkPermissions = true,
        checkConflicts = true,
        checkInheritance = true,
        detailed = false
      } = options;

      const results = {
        valid: true,
        roles: this.processRoles(roles),
        hierarchy: this.checkHierarchy(roles),
        conflicts: [],
        warnings: [],
        recommendations: []
      };

      // Check permissions if requested
      if (checkPermissions) {
        results.permissions = this.checkPermissions(roles);
      }

      // Check for conflicts if requested
      if (checkConflicts) {
        results.conflicts = this.checkConflicts(roles);
      }

      // Check inheritance if requested
      if (checkInheritance) {
        results.inheritance = this.checkInheritance(roles);
      }

      // Generate overall validation
      results.valid = this.validateOverall(results);

      // Generate recommendations
      results.recommendations = this.generateRecommendations(results);

      return {
        success: true,
        results,
        summary: this.generateSummary(results)
      };
    } catch (error) {
      return {
        success: false,
        error: `Role hierarchy check failed: ${error.message}`
      };
    }
  }

  /**
   * Process roles array
   * @param {Array} roles - Raw roles array
   * @returns {Array} Processed roles
   */
  processRoles(roles) {
    return roles.map((role, index) => ({
      id: role.id || `role_${index}`,
      name: role.name || `Role ${index + 1}`,
      position: role.position || index,
      permissions: role.permissions || 0,
      color: role.color || 0,
      hoist: role.hoist || false,
      mentionable: role.mentionable || false,
      managed: role.managed || false,
      permissionsList: this.parsePermissions(role.permissions || 0)
    }));
  }

  /**
   * Check role hierarchy
   * @param {Array} roles - Roles array
   * @returns {Object} Hierarchy analysis
   */
  checkHierarchy(roles) {
    const sortedRoles = [...roles].sort((a, b) => (b.position || 0) - (a.position || 0));
    
    const analysis = {
      totalRoles: roles.length,
      highestPosition: Math.max(...roles.map(r => r.position || 0)),
      lowestPosition: Math.min(...roles.map(r => r.position || 0)),
      sortedRoles: sortedRoles.map(role => ({
        name: role.name,
        position: role.position || 0,
        permissions: role.permissions || 0
      })),
      issues: []
    };

    // Check for duplicate positions
    const positions = roles.map(r => r.position || 0);
    const duplicates = positions.filter((pos, index) => positions.indexOf(pos) !== index);
    
    if (duplicates.length > 0) {
      analysis.issues.push({
        type: 'duplicate_position',
        message: 'Multiple roles have the same position',
        positions: [...new Set(duplicates)]
      });
    }

    // Check for gaps in hierarchy
    const sortedPositions = [...new Set(positions)].sort((a, b) => b - a);
    for (let i = 0; i < sortedPositions.length - 1; i++) {
      if (sortedPositions[i] - sortedPositions[i + 1] > 1) {
        analysis.issues.push({
          type: 'hierarchy_gap',
          message: 'Gap in role hierarchy',
          gap: `${sortedPositions[i + 1]} to ${sortedPositions[i]}`
        });
      }
    }

    return analysis;
  }

  /**
   * Check role permissions
   * @param {Array} roles - Roles array
   * @returns {Object} Permission analysis
   */
  checkPermissions(roles) {
    const analysis = {
      totalRoles: roles.length,
      rolesWithAdmin: 0,
      rolesWithManageRoles: 0,
      rolesWithModeration: 0,
      rolesWithCommunication: 0,
      rolesWithVoice: 0,
      warnings: []
    };

    roles.forEach(role => {
      const permissions = this.parsePermissions(role.permissions || 0);
      
      if (permissions.includes('ADMINISTRATOR')) {
        analysis.rolesWithAdmin++;
      }
      
      if (permissions.includes('MANAGE_ROLES')) {
        analysis.rolesWithManageRoles++;
      }
      
      if (permissions.includes('KICK_MEMBERS') || permissions.includes('BAN_MEMBERS')) {
        analysis.rolesWithModeration++;
      }
      
      if (permissions.includes('SEND_MESSAGES') || permissions.includes('MANAGE_MESSAGES')) {
        analysis.rolesWithCommunication++;
      }
      
      if (permissions.includes('CONNECT') || permissions.includes('SPEAK')) {
        analysis.rolesWithVoice++;
      }
    });

    // Generate warnings
    if (analysis.rolesWithAdmin > 1) {
      analysis.warnings.push({
        type: 'multiple_admin',
        message: `${analysis.rolesWithAdmin} roles have ADMINISTRATOR permission`,
        severity: 'high'
      });
    }

    if (analysis.rolesWithManageRoles > 2) {
      analysis.warnings.push({
        type: 'multiple_manage_roles',
        message: `${analysis.rolesWithManageRoles} roles have MANAGE_ROLES permission`,
        severity: 'medium'
      });
    }

    return analysis;
  }

  /**
   * Check for role conflicts
   * @param {Array} roles - Roles array
   * @returns {Array} Conflict list
   */
  checkConflicts(roles) {
    const conflicts = [];

    // Check for conflicting permissions
    roles.forEach((role, index) => {
      const permissions = this.parsePermissions(role.permissions || 0);
      
      // Check for redundant permissions with ADMINISTRATOR
      if (permissions.includes('ADMINISTRATOR')) {
        const redundantPermissions = permissions.filter(p => p !== 'ADMINISTRATOR');
        if (redundantPermissions.length > 0) {
          conflicts.push({
            role: role.name,
            type: 'redundant_permissions',
            message: 'ADMINISTRATOR permission makes other permissions redundant',
            permissions: redundantPermissions,
            severity: 'medium'
          });
        }
      }

      // Check for dangerous permission combinations
      if (permissions.includes('MANAGE_ROLES') && permissions.includes('ADMINISTRATOR')) {
        conflicts.push({
          role: role.name,
          type: 'dangerous_combination',
          message: 'MANAGE_ROLES is redundant with ADMINISTRATOR',
          severity: 'low'
        });
      }
    });

    return conflicts;
  }

  /**
   * Check role inheritance
   * @param {Array} roles - Roles array
   * @returns {Object} Inheritance analysis
   */
  checkInheritance(roles) {
    const sortedRoles = [...roles].sort((a, b) => (b.position || 0) - (a.position || 0));
    
    const analysis = {
      inheritanceChain: [],
      issues: []
    };

    // Build inheritance chain
    sortedRoles.forEach((role, index) => {
      const permissions = this.parsePermissions(role.permissions || 0);
      analysis.inheritanceChain.push({
        name: role.name,
        position: role.position || 0,
        permissions: permissions,
        inheritedFrom: index > 0 ? sortedRoles[index - 1].name : null
      });
    });

    // Check for inheritance issues
    for (let i = 1; i < sortedRoles.length; i++) {
      const currentRole = sortedRoles[i];
      const higherRole = sortedRoles[i - 1];
      
      const currentPermissions = this.parsePermissions(currentRole.permissions || 0);
      const higherPermissions = this.parsePermissions(higherRole.permissions || 0);
      
      // Check if lower role has permissions that higher role doesn't
      const missingInHigher = currentPermissions.filter(p => !higherPermissions.includes(p));
      if (missingInHigher.length > 0) {
        analysis.issues.push({
          type: 'inheritance_violation',
          message: `Lower role "${currentRole.name}" has permissions that higher role "${higherRole.name}" doesn't have`,
          permissions: missingInHigher,
          severity: 'medium'
        });
      }
    }

    return analysis;
  }

  /**
   * Parse permission bitfield
   * @param {number} permissions - Permission bitfield
   * @returns {Array} Permission names
   */
  parsePermissions(permissions) {
    const permissionNames = [];
    const permissionsBigInt = BigInt(permissions);

    Object.entries(this.permissions).forEach(([name, value]) => {
      if ((permissionsBigInt & value) === value) {
        permissionNames.push(name);
      }
    });

    return permissionNames;
  }

  /**
   * Validate overall hierarchy
   * @param {Object} results - Check results
   * @returns {boolean} Is valid
   */
  validateOverall(results) {
    // Check for critical issues
    const criticalIssues = [
      ...results.hierarchy.issues.filter(issue => issue.type === 'duplicate_position'),
      ...results.permissions?.warnings.filter(w => w.severity === 'high') || [],
      ...results.conflicts.filter(c => c.severity === 'high') || []
    ];

    return criticalIssues.length === 0;
  }

  /**
   * Generate recommendations
   * @param {Object} results - Check results
   * @returns {Array} Recommendations
   */
  generateRecommendations(results) {
    const recommendations = [];

    // Hierarchy recommendations
    if (results.hierarchy.issues.length > 0) {
      recommendations.push({
        type: 'hierarchy',
        message: 'Fix role hierarchy issues',
        action: 'Reorder roles to eliminate duplicate positions and gaps',
        priority: 'high'
      });
    }

    // Permission recommendations
    if (results.permissions?.warnings.length > 0) {
      recommendations.push({
        type: 'permissions',
        message: 'Review role permissions',
        action: 'Consider reducing the number of roles with elevated permissions',
        priority: 'medium'
      });
    }

    // Conflict recommendations
    if (results.conflicts.length > 0) {
      recommendations.push({
        type: 'conflicts',
        message: 'Resolve role conflicts',
        action: 'Remove redundant permissions and fix dangerous combinations',
        priority: 'medium'
      });
    }

    // Inheritance recommendations
    if (results.inheritance?.issues.length > 0) {
      recommendations.push({
        type: 'inheritance',
        message: 'Fix role inheritance',
        action: 'Ensure higher roles have all permissions of lower roles',
        priority: 'medium'
      });
    }

    // General recommendations
    if (results.valid) {
      recommendations.push({
        type: 'success',
        message: 'Role hierarchy is well-structured',
        action: 'Continue monitoring role permissions and hierarchy',
        priority: 'low'
      });
    }

    return recommendations;
  }

  /**
   * Generate summary
   * @param {Object} results - Check results
   * @returns {Object} Summary
   */
  generateSummary(results) {
    return {
      totalRoles: results.roles.length,
      valid: results.valid,
      issues: results.hierarchy.issues.length + 
              (results.permissions?.warnings.length || 0) + 
              results.conflicts.length + 
              (results.inheritance?.issues.length || 0),
      warnings: results.warnings.length,
      recommendations: results.recommendations.length,
      health: results.valid ? 'healthy' : 'needs_attention'
    };
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
          roles: {
            type: 'array',
            description: 'Array of role objects with id, name, position, and permissions',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                position: { type: 'number' },
                permissions: { type: 'number' },
                color: { type: 'number' },
                hoist: { type: 'boolean' },
                mentionable: { type: 'boolean' },
                managed: { type: 'boolean' }
              }
            }
          },
          checkPermissions: {
            type: 'boolean',
            description: 'Check role permissions (default: true)',
            default: true
          },
          checkConflicts: {
            type: 'boolean',
            description: 'Check for permission conflicts (default: true)',
            default: true
          },
          checkInheritance: {
            type: 'boolean',
            description: 'Check role inheritance (default: true)',
            default: true
          },
          detailed: {
            type: 'boolean',
            description: 'Include detailed analysis (default: false)',
            default: false
          }
        },
        required: ['roles']
      }
    };
  }
}

export default RoleHierarchyCheckerTool;
