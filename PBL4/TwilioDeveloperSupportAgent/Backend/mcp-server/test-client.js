#!/usr/bin/env node

/**
 * Test client for the Twilio Web Search MCP Server
 * This script demonstrates how to interact with the MCP server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPTestClient {
  constructor() {
    this.serverProcess = null;
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['server.js'], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcess.on('error', (error) => {
        reject(error);
      });

      this.serverProcess.on('spawn', () => {
        console.log('✅ MCP Server started');
        resolve();
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.log('Server stderr:', data.toString());
      });
    });
  }

  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      let responseData = '';
      
      this.serverProcess.stdout.on('data', (data) => {
        responseData += data.toString();
        
        // Try to parse complete JSON response
        const lines = responseData.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                resolve(response);
                return;
              }
            } catch (e) {
              // Not a complete JSON response yet
            }
          }
        }
      });

      // Send the request
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);
    });
  }

  async testTools() {
    console.log('\n🧪 Testing MCP Tools...\n');

    // Test 1: List available tools
    console.log('1. Testing list_tools...');
    try {
      const toolsResponse = await this.sendRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      });
      console.log('✅ Available tools:', toolsResponse.result.tools.length);
      toolsResponse.result.tools.forEach(tool => {
        console.log(`   - ${tool.name}: ${tool.description}`);
      });
    } catch (error) {
      console.error('❌ List tools failed:', error.message);
    }

    // Test 2: Web search
    console.log('\n2. Testing web_search...');
    try {
      const searchResponse = await this.sendRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'web_search',
          arguments: {
            query: 'twilio sms api error 21211',
            maxResults: 3
          }
        }
      });
      console.log('✅ Web search completed');
      if (searchResponse.result.content && searchResponse.result.content[0]) {
        const results = JSON.parse(searchResponse.result.content[0].text);
        console.log(`   Found ${results.results.length} results`);
        if (results.results.length > 0) {
          console.log(`   Top result: ${results.results[0].title}`);
        }
      }
    } catch (error) {
      console.error('❌ Web search failed:', error.message);
    }

    // Test 3: Twilio updates
    console.log('\n3. Testing twilio_updates...');
    try {
      const updatesResponse = await this.sendRequest({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'twilio_updates',
          arguments: {
            query: 'new features 2024',
            maxResults: 2
          }
        }
      });
      console.log('✅ Twilio updates search completed');
      if (updatesResponse.result.content && updatesResponse.result.content[0]) {
        const results = JSON.parse(updatesResponse.result.content[0].text);
        console.log(`   Found ${results.results.length} update results`);
      }
    } catch (error) {
      console.error('❌ Twilio updates failed:', error.message);
    }

    // Test 4: Error solutions
    console.log('\n4. Testing error_solutions...');
    try {
      const errorResponse = await this.sendRequest({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'error_solutions',
          arguments: {
            errorCode: '21211',
            query: 'invalid phone number',
            maxResults: 2
          }
        }
      });
      console.log('✅ Error solutions search completed');
      if (errorResponse.result.content && errorResponse.result.content[0]) {
        const results = JSON.parse(errorResponse.result.content[0].text);
        console.log(`   Found ${results.results.length} solution results`);
      }
    } catch (error) {
      console.error('❌ Error solutions failed:', error.message);
    }

    // Test 5: Search stats
    console.log('\n5. Testing search_stats...');
    try {
      const statsResponse = await this.sendRequest({
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'search_stats',
          arguments: {}
        }
      });
      console.log('✅ Search stats retrieved');
      if (statsResponse.result.content && statsResponse.result.content[0]) {
        const stats = JSON.parse(statsResponse.result.content[0].text);
        console.log(`   Cache size: ${stats.cacheSize}`);
        console.log(`   Supported engines: ${stats.supportedEngines.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Search stats failed:', error.message);
    }
  }

  async run() {
    try {
      await this.startServer();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for server to be ready
      await this.testTools();
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    } finally {
      if (this.serverProcess) {
        this.serverProcess.kill();
        console.log('\n🛑 MCP Server stopped');
      }
    }
  }
}

// Run the test
const client = new MCPTestClient();
client.run();
