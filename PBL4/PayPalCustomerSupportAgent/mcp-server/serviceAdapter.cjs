// CommonJS wrapper for backend to use ES module service
// This file allows the backend (CommonJS) to import the ES module service

// Cache for the loaded service class
let MCPToolsServiceClass = null;
let loadingPromise = null;

async function loadService() {
  if (MCPToolsServiceClass) {
    return MCPToolsServiceClass;
  }

  if (!loadingPromise) {
    loadingPromise = (async () => {
      try {
        const module = await import("./src/index.js");
        MCPToolsServiceClass = module.default;
        return MCPToolsServiceClass;
      } catch (err) {
        console.error("Failed to load MCP service:", err);
        throw err;
      }
    })();
  }

  return loadingPromise;
}

// Export a class wrapper that handles async loading
module.exports = class MCPToolsService {
  constructor() {
    // Store promise for service class
    this._servicePromise = loadService();
    this._service = null;
  }

  // Helper to get the actual service instance
  async _getService() {
    if (!this._service) {
      const ServiceClass = await this._servicePromise;
      this._service = new ServiceClass();
    }
    return this._service;
  }

  async getTriggeredTools(query) {
    const service = await this._getService();
    return await service.getTriggeredTools(query);
  }

  async getToolData(toolType, query) {
    const service = await this._getService();
    return await service.getToolData(toolType, query);
  }

  async handleCurrencyQuery(query) {
    const service = await this._getService();
    return await service.handleCurrencyQuery(query);
  }

  async handleWebSearchQuery(query) {
    const service = await this._getService();
    return await service.handleWebSearchQuery(query);
  }

  async handleFeeQuery(query) {
    const service = await this._getService();
    return await service.handleFeeQuery(query);
  }

  async handleTimelineQuery(query) {
    const service = await this._getService();
    return await service.handleTimelineQuery(query);
  }

  async processQuery(query) {
    const service = await this._getService();
    return await service.processQuery(query);
  }

  async executeTool(toolName, args) {
    const service = await this._getService();
    return await service.executeTool(toolName, args);
  }

  // Expose services for fallback parsing if needed
  get currencyService() {
    // This will fail if service not loaded, but that's okay for fallback
    return this._service?.currencyService;
  }

  get feeCalculator() {
    return this._service?.feeCalculator;
  }

  get timelineService() {
    return this._service?.timelineService;
  }
};
