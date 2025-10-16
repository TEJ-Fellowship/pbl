const MCPToolsService = require('./src/index');

// Create MCP Tools Service instance
const mcpService = new MCPToolsService();

console.log('🚀 MCP Server starting...');
console.log('📡 MCP Tools Service ready');
console.log('💱 Currency Exchange Service: Available');
console.log('🌐 Web Search Service: Available');
console.log('🧮 Fee Calculator Service: Available');
console.log('');
console.log('✅ MCP Server is running and ready to process queries');
console.log('📝 Send queries to processQuery() method');
console.log('');

// Keep the server running
process.on('SIGINT', () => {
  console.log('\n🛑 MCP Server shutting down...');
  process.exit(0);
});

// Export for potential external use
module.exports = mcpService;
