/**
 * Query Router - Executes routing decisions from QueryClassifier
 *
 * This module handles the actual execution of routing decisions:
 * - MCP: Calls MCP tools
 * - Hybrid: Runs hybrid search
 * - Combined: Runs both MCP + Hybrid
 * - General: Runs web search
 *
 * Separated from QueryClassifier which only makes decisions.
 */

import chalk from "chalk";
import config from "../config/config.js";
import HybridSearch from "./hybridSearch.js";
import GeneralSearch from "./generalSearch.js";

class QueryRouter {
  constructor(vectorStore, embeddings, mcpServer) {
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
    this.mcpServer = mcpServer;
  }

  /**
   * Route and execute query based on classification
   */
  async route(classification, query, enhancements) {
    const results = {
      chunks: [],
      mcpResult: null,
      generalSearchResults: null,
      toolsUsed: [],
    };

    // Initialize GeneralSearch (lightweight, no initialization needed)
    const generalSearch = new GeneralSearch();

    // Helper function to initialize hybrid search only when needed
    const ensureHybridSearch = async () => {
      const hybridSearch = new HybridSearch(this.vectorStore, this.embeddings);
      if (!hybridSearch.isInitialized) {
        await hybridSearch.initialize();
      }
      return hybridSearch;
    };

    switch (classification.route) {
      case "mcp": {
        // Direct MCP tool answer
        if (!this.mcpServer) {
          console.log(
            chalk.yellow(
              `⚠️ MCP Server not available. Falling back to Hybrid Search...`
            )
          );
          // Initialize hybrid search only for fallback
          const hybridSearch = await ensureHybridSearch();
          // Fallback to hybrid search
          const hybridResults = await hybridSearch.hybridSearch(
            query,
            parseInt(config.MAX_CHUNKS) || 10
          );
          results.chunks = hybridResults.map((result) => ({
            content: result.content,
            metadata: result.metadata,
            similarity: result.finalScore,
            score: result.finalScore,
            searchType: result.searchType || "hybrid",
          }));
          break;
        }

        console.log(
          chalk.blue(`\n🔧 Executing MCP tool: ${classification.mcpTool}`)
        );

        results.mcpResult = await this.mcpServer.executeTool(
          classification.mcpTool,
          query,
          enhancements,
          generalSearch
        );
        results.toolsUsed.push(classification.mcpTool);

        console.log(chalk.green(`✅ MCP tool executed successfully`));
        break;
      }

      case "hybrid": {
        // Documentation search only
        console.log(chalk.blue(`\n📚 Executing Hybrid Search...`));
        const hybridSearch = await ensureHybridSearch();
        const hybridResults = await hybridSearch.hybridSearch(
          classification.hybridQuery || query,
          parseInt(config.MAX_CHUNKS) || 10
        );

        results.chunks = hybridResults.map((result) => ({
          content: result.content,
          metadata: result.metadata,
          similarity: result.finalScore,
          score: result.finalScore,
          searchType: result.searchType || "hybrid",
        }));

        console.log(
          chalk.green(`✅ Hybrid search found ${results.chunks.length} chunks`)
        );
        break;
      }

      case "combined": {
        // Both MCP tool + Hybrid search
        console.log(chalk.blue(`\n🔧📚 Executing Combined (MCP + Hybrid)...`));

        // Execute MCP tool (if available)
        if (this.mcpServer) {
          console.log(
            chalk.blue(`   Step 1: MCP tool - ${classification.mcpTool}`)
          );
          results.mcpResult = await this.mcpServer.executeTool(
            classification.mcpTool,
            query,
            enhancements,
            generalSearch
          );
          results.toolsUsed.push(classification.mcpTool);
        } else {
          console.log(
            chalk.yellow(`   ⚠️ MCP Server not available, skipping MCP tool`)
          );
        }

        // Execute Hybrid search
        console.log(chalk.blue(`   Step 2: Hybrid search`));
        const hybridSearch = await ensureHybridSearch();
        const hybridResults = await hybridSearch.hybridSearch(
          classification.hybridQuery || query,
          parseInt(config.MAX_CHUNKS) || 10
        );

        results.chunks = hybridResults.map((result) => ({
          content: result.content,
          metadata: result.metadata,
          similarity: result.finalScore,
          score: result.finalScore,
          searchType: result.searchType || "hybrid",
        }));

        console.log(
          chalk.green(
            `✅ Combined execution complete: ${
              results.mcpResult ? "MCP tool + " : ""
            }${results.chunks.length} chunks`
          )
        );
        break;
      }

      case "general": {
        // General web search
        console.log(chalk.blue(`\n🌐 Executing General Search (Web)...`));

        if (generalSearch.isAvailable()) {
          // Web search available - no need to initialize hybrid search
          results.generalSearchResults = await generalSearch.performWebSearch(
            query,
            5
          );
          console.log(
            chalk.green(
              `✅ General search found ${
                results.generalSearchResults.results?.length || 0
              } results`
            )
          );
        } else {
          console.log(
            chalk.yellow(
              `⚠️ General search not available (missing API credentials)`
            )
          );
          // Fallback to hybrid search - only initialize when needed
          console.log(chalk.blue(`   Falling back to Hybrid Search...`));
          const hybridSearch = await ensureHybridSearch();
          const hybridResults = await hybridSearch.hybridSearch(
            query,
            parseInt(config.MAX_CHUNKS) || 10
          );
          results.chunks = hybridResults.map((result) => ({
            content: result.content,
            metadata: result.metadata,
            similarity: result.finalScore,
            score: result.finalScore,
            searchType: result.searchType || "hybrid",
          }));
          console.log(
            chalk.green(
              `✅ Hybrid search fallback found ${results.chunks.length} chunks`
            )
          );
        }
        break;
      }

      default: {
        throw new Error(`Unknown route: ${classification.route}`);
      }
    }

    return results;
  }
}

export default QueryRouter;
