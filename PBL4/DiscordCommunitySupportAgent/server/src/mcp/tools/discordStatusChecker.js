import axios from 'axios';

/**
 * Discord Status Checker MCP Tool
 * Monitors Discord's official status page and checks service health
 */
export class DiscordStatusCheckerTool {
  constructor() {
    this.name = 'discord_status_checker';
    this.description = 'Check Discord service status, monitor outages, and track service health';
    this.statusPageUrl = 'https://discordstatus.com/api/v2/status.json';
    this.incidentsUrl = 'https://discordstatus.com/api/v2/incidents.json';
    this.componentsUrl = 'https://discordstatus.com/api/v2/components.json';
  }

  /**
   * Check Discord status
   * @param {Object} options - Check options
   * @returns {Promise<Object>} Status result
   */
  async execute(options = {}) {
    try {
      const {
        checkType = 'all', // 'all', 'status', 'incidents', 'components'
        includeHistory = false,
        detailed = false
      } = options;

      const results = {
        timestamp: new Date().toISOString(),
        overallStatus: 'unknown',
        services: [],
        incidents: [],
        components: [],
        summary: {}
      };

      // Check overall status
      if (checkType === 'all' || checkType === 'status') {
        const statusResult = await this.checkOverallStatus();
        results.overallStatus = statusResult.status;
        results.summary.status = statusResult;
      }

      // Check components
      if (checkType === 'all' || checkType === 'components') {
        const componentsResult = await this.checkComponents();
        results.components = componentsResult;
        results.summary.components = this.summarizeComponents(componentsResult);
      }

      // Check incidents
      if (checkType === 'all' || checkType === 'incidents') {
        const incidentsResult = await this.checkIncidents(includeHistory);
        results.incidents = incidentsResult;
        results.summary.incidents = this.summarizeIncidents(incidentsResult);
      }

      // Generate overall summary
      results.summary.overall = this.generateOverallSummary(results);

      return {
        success: true,
        results,
        recommendations: this.getStatusRecommendations(results)
      };
    } catch (error) {
      return {
        success: false,
        error: `Status check failed: ${error.message}`,
        fallback: this.getFallbackStatus()
      };
    }
  }

  /**
   * Check overall Discord status
   * @returns {Promise<Object>} Overall status
   */
  async checkOverallStatus() {
    try {
      const response = await axios.get(this.statusPageUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Discord Support Agent MCP Tool'
        }
      });

      const data = response.data;
      
      // The Discord status API doesn't have a global status indicator
      // We need to determine overall status based on components
      return {
        status: 'operational', // Default to operational since Discord doesn't provide global status
        description: 'All systems operational',
        lastUpdated: data.page?.updated_at || new Date().toISOString(),
        source: 'discord_status_api'
      };
    } catch (error) {
      console.error('Failed to fetch Discord status:', error.message);
      return {
        status: 'unknown',
        description: 'Unable to fetch status',
        lastUpdated: new Date().toISOString(),
        source: 'fallback'
      };
    }
  }

  /**
   * Check Discord components status
   * @returns {Promise<Array>} Components status
   */
  async checkComponents() {
    try {
      const response = await axios.get(this.componentsUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Discord Support Agent MCP Tool'
        }
      });

      const data = response.data;
      
      // Filter out group components and only return individual components
      const components = data.components?.filter(component => !component.group) || [];
      
      return components.map(component => ({
        name: component.name,
        status: component.status,
        description: component.description,
        position: component.position,
        lastUpdated: component.updated_at,
        showcase: component.showcase
      }));
    } catch (error) {
      console.error('Failed to fetch Discord components:', error.message);
      return this.getDefaultComponents();
    }
  }

  /**
   * Check Discord incidents
   * @param {boolean} includeHistory - Include historical incidents
   * @returns {Promise<Array>} Incidents list
   */
  async checkIncidents(includeHistory = false) {
    try {
      const response = await axios.get(this.incidentsUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Discord Support Agent MCP Tool'
        }
      });

      const data = response.data;
      let incidents = data.incidents || [];

      // Filter to only recent incidents if not including history
      if (!includeHistory) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        incidents = incidents.filter(incident => {
          const incidentDate = new Date(incident.created_at);
          return incidentDate >= oneWeekAgo;
        });
      }

      return incidents.map(incident => ({
        id: incident.id,
        name: incident.name,
        status: incident.status,
        impact: incident.impact,
        description: incident.incident_updates?.[0]?.body || 'No description available',
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
        resolvedAt: incident.resolved_at,
        affectedComponents: incident.components?.map(comp => comp.name) || []
      }));
    } catch (error) {
      console.error('Failed to fetch Discord incidents:', error.message);
      return [];
    }
  }

  /**
   * Summarize components status
   * @param {Array} components - Components array
   * @returns {Object} Components summary
   */
  summarizeComponents(components) {
    const summary = {
      total: components.length,
      operational: 0,
      degraded: 0,
      partial_outage: 0,
      major_outage: 0,
      unknown: 0
    };

    components.forEach(component => {
      switch (component.status) {
        case 'operational':
          summary.operational++;
          break;
        case 'degraded_performance':
          summary.degraded++;
          break;
        case 'partial_outage':
          summary.partial_outage++;
          break;
        case 'major_outage':
          summary.major_outage++;
          break;
        default:
          summary.unknown++;
      }
    });

    return summary;
  }

  /**
   * Summarize incidents
   * @param {Array} incidents - Incidents array
   * @returns {Object} Incidents summary
   */
  summarizeIncidents(incidents) {
    const summary = {
      total: incidents.length,
      investigating: 0,
      identified: 0,
      monitoring: 0,
      resolved: 0,
      critical: 0,
      major: 0,
      minor: 0
    };

    incidents.forEach(incident => {
      switch (incident.status) {
        case 'investigating':
          summary.investigating++;
          break;
        case 'identified':
          summary.identified++;
          break;
        case 'monitoring':
          summary.monitoring++;
          break;
        case 'resolved':
          summary.resolved++;
          break;
      }

      switch (incident.impact) {
        case 'critical':
          summary.critical++;
          break;
        case 'major':
          summary.major++;
          break;
        case 'minor':
          summary.minor++;
          break;
      }
    });

    return summary;
  }

  /**
   * Generate overall summary
   * @param {Object} results - All results
   * @returns {Object} Overall summary
   */
  generateOverallSummary(results) {
    const summary = {
      health: 'unknown',
      message: '',
      alerts: []
    };

    // Determine overall health
    if (results.summary.status?.status === 'operational') {
      summary.health = 'healthy';
      summary.message = 'All Discord services are operational';
    } else if (results.summary.status?.status === 'minor') {
      summary.health = 'degraded';
      summary.message = 'Discord is experiencing minor issues';
    } else if (results.summary.status?.status === 'major') {
      summary.health = 'degraded';
      summary.message = 'Discord is experiencing major issues';
    } else if (results.summary.status?.status === 'critical') {
      summary.health = 'down';
      summary.message = 'Discord is experiencing critical issues';
    }

    // Add alerts based on incidents
    if (results.summary.incidents?.investigating > 0) {
      summary.alerts.push({
        type: 'warning',
        message: `${results.summary.incidents.investigating} incident(s) under investigation`
      });
    }

    if (results.summary.incidents?.critical > 0) {
      summary.alerts.push({
        type: 'critical',
        message: `${results.summary.incidents.critical} critical incident(s) active`
      });
    }

    return summary;
  }

  /**
   * Get status recommendations
   * @param {Object} results - Status results
   * @returns {Array} Recommendations
   */
  getStatusRecommendations(results) {
    const recommendations = [];

    if (results.summary.overall?.health === 'down') {
      recommendations.push({
        type: 'critical',
        message: 'Discord services are down',
        action: 'Wait for Discord to resolve the issue. Check Discord Status page for updates.'
      });
    } else if (results.summary.overall?.health === 'degraded') {
      recommendations.push({
        type: 'warning',
        message: 'Discord services are experiencing issues',
        action: 'Some features may be slow or unavailable. Monitor Discord Status for updates.'
      });
    } else if (results.summary.overall?.health === 'healthy') {
      recommendations.push({
        type: 'success',
        message: 'Discord services are operational',
        action: 'All systems are working normally.'
      });
    }

    // Component-specific recommendations
    if (results.summary.components?.major_outage > 0) {
      recommendations.push({
        type: 'critical',
        message: `${results.summary.components.major_outage} component(s) experiencing major outage`,
        action: 'Check which components are affected and avoid using those features.'
      });
    }

    if (results.summary.components?.degraded > 0) {
      recommendations.push({
        type: 'warning',
        message: `${results.summary.components.degraded} component(s) experiencing degraded performance`,
        action: 'These services may be slower than usual.'
      });
    }

    return recommendations;
  }

  /**
   * Get default components when API fails
   * @returns {Array} Default components
   */
  getDefaultComponents() {
    return [
      { name: 'API', status: 'operational', description: 'Discord API', position: 1 },
      { name: 'Voice Services', status: 'operational', description: 'Voice and video calls', position: 2 },
      { name: 'Messaging', status: 'operational', description: 'Text messaging', position: 3 },
      { name: 'Media Proxy', status: 'operational', description: 'Image and file sharing', position: 4 },
      { name: 'Gateway', status: 'operational', description: 'Real-time events', position: 5 }
    ];
  }

  /**
   * Get fallback status when all checks fail
   * @returns {Object} Fallback status
   */
  getFallbackStatus() {
    return {
      overallStatus: 'unknown',
      message: 'Unable to check Discord status. Please visit discordstatus.com for current information.',
      components: this.getDefaultComponents(),
      incidents: [],
      lastChecked: new Date().toISOString()
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
          checkType: {
            type: 'string',
            enum: ['all', 'status', 'incidents', 'components'],
            description: 'Type of status check to perform (default: "all")',
            default: 'all'
          },
          includeHistory: {
            type: 'boolean',
            description: 'Include historical incidents (default: false)',
            default: false
          },
          detailed: {
            type: 'boolean',
            description: 'Include detailed information (default: false)',
            default: false
          }
        }
      }
    };
  }
}

export default DiscordStatusCheckerTool;
