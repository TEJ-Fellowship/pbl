/**
 * @fileoverview MCP (Model Context Protocol) Server for Stripe Customer Service Agent
 *
 * Exposes two tools to any MCP-compatible LLM host (Claude Desktop, etc.):
 *   1. `get_stripe_status`  – fetches live Stripe system status from status.stripe.com
 *   2. `web_search`         – performs a web search via Google Custom Search JSON API (free tier)
 *
 * Transport: stdio  (the host process spawns this script and communicates over stdin/stdout)
 *
 * Usage:
 *   npm run mcp
 *   node src/mcp/mcpServer.js
 *
 * Loads `.env` from cwd (same as other backend scripts).
 *
 * Required environment variables:
 *   GOOGLE_API_KEY           – your Google Cloud API key
 *                              (enable "Custom Search API" at https://console.cloud.google.com)
 *   GOOGLE_SEARCH_ENGINE_ID  – your Programmable Search Engine ID
 *                              (create one at https://programmablesearchengine.google.com)
 *
 * Free tier limits (as of 2024):
 *   - 100 search queries per day at no cost
 *   - Max 10 results per request
 *
 * @author  Niru K. Magar
 * @version 2.0.0
 */
require("dotenv").config();

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Public Stripe status JSON endpoint – no auth required*/
const STRIPE_STATUS_URL = "https://status.stripe.com/api/v2/summary.json";
/**
 * Google Custom Search JSON API endpoint.
 * Docs: https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list
 *
 * Query params we use:
 *   key  – your GOOGLE_API_KEY
 *   cx   – your GOOGLE_SEARCH_ENGINE_ID
 *   q    – the search query string
 *   num  – number of results (1–10)
 */
const GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1";

/** Default number of results to fetch from Google (max allowed per request: 10) */
const DEFAULT_RESULT_COUNT = 5;

/**
 * @param {string} name - Env var name
 * @returns {string} Trimmed non-empty value
 * @throws {Error} If missing or blank
 */
function requireEnv(name) {
  const v = process.env[name];
  if (v === undefined || String(v).trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(v).trim();
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Maps a raw Stripe component status string to a human-readable label with emoji.
 *
 * Stripe returns values like "operational", "degraded_performance", etc.
 * We map these to friendly strings so Claude can present them cleanly.
 *
 * @param {string} status - Raw status string from the Stripe status API
 * @returns {string} Human-readable label e.g. "✅ Operational"
 */

function getFriendlyStatus(status) {
  const map = {
    operational: "✅ Operational",
    degraded_performance: "⚠️  Degraded Performance",
    partial_outage: "🔶 Partial Outage",
    major_outage: "🔴 Major Outage",
    under_maintenance: "🔧 Under Maintenance",
  };
  // Fallback: if Stripe ever adds a new status we haven't mapped, show it raw
  return map[status] ?? `❓ Unknown (${status})`;
}

/**
 * Fetches a URL and returns the parsed JSON body.
 *
 * Centralising fetch logic here means:
 *   - One place to add retries / timeouts later
 *   - Consistent error messages across all tool handlers
 *   - Keeps handler code clean and focused on business logic
 *
 * @async
 * @param {string} url               - Fully-formed URL to request
 * @param {RequestInit} [options={}] - Optional fetch options (headers, method…)
 * @returns {Promise<unknown>}        Parsed JSON from the response body
 * @throws {Error} If the HTTP status is not 2xx, or the body is not valid JSON
 */

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);

  if (!res.ok) {
    // Read the body text for a richer error message
    const body = await res.text().catch(() => "(unreadable body)");
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}\n${body}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
//  Tool handler – Stripe Status
// ---------------------------------------------------------------------------

/**
 * Retrieves the current live status of all Stripe services.
 *
 * Hits the public Stripe status page API (no auth needed) and formats:
 *   - Overall indicator and plain-English description
 *   - Per-component status table (API, Webhooks, Dashboard, etc.)
 *   - Any active incidents with the most recent update body + timestamp
 *
 * This is useful when a customer reports something like "my payments are failing"
 * and the agent needs to check whether Stripe itself is experiencing issues.
 *
 * @async
 * @returns {Promise<{ content: Array<{ type: "text"; text: string }> }>}
 *   MCP-compatible result with Markdown-formatted status report
 * @throws {Error} If the Stripe status API is unreachable
 */

async function handleGetStripeStatus() {
  const data = await fetchJson(STRIPE_STATUS_URL);

  // Overall headline status
  const overall = data.status ?? {};
  const lines = [
    "## Stripe System Status",
    `**Overall:** ${getFriendlyStatus(overall.indimjt4rtcator ?? "unknown")} — ${overall.description ?? "No description"}`,
    "",
  ];

  // Component-level breakdown
  // Filter out "group: true" entries – these are parent roll-up rows, not real components
  const components = (data.components ?? []).filter(
    // Hide child components that are already rolled up by a parent
    (c) => !c.group,
  );
  if (components.length > 0) {
    lines.push("### Components");
    for (const c of components) {
      lines.push(`- **${c.name}**: ${getFriendlyStatus(c.status)}`);
    }
    lines.push("");
  }

  // Active incidents (empty array means all clear)
  const incidents = data.incidents ?? [];
  if (incidents.length > 0) {
    lines.push("### Active Incidents");
    for (const inc of incidents) {
      // incident_updates is newest-first, so index 0 = latest update
      const latestUpdate = inc.incident_updates?.[0];
      lines.push(`- **${inc.name}** *(${inc.status})*`);
      if (latestUpdate) {
        lines.push(
          `  > ${latestUpdate.body}\n` +
            `  > *Updated: ${new Date(latestUpdate.created_at).toUTCString()}*`,
        );
      }
    }
  } else {
    lines.push("_No active incidents. All systems operational._");
  }

  return { content: [{ type: "text", text: lines.join("\n") }] };
}
// ---------------------------------------------------------------------------
// Tool handler – Google Web Search
// ---------------------------------------------------------------------------

/**
 * Performs a web search using the Google Custom Search JSON API.
 *
 * WHY GOOGLE CUSTOM SEARCH?
 *   - Free tier: 100 queries/day, no credit card required for basic use
 *   - Returns structured JSON with title, link, and snippet per result
 *   - Backed by the same index as google.com — high-quality results
 *
 * HOW IT WORKS (step by step):
 *   1. Read GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID from env
 *   2. Build the request URL with query params (key, cx, q, num)
 *   3. GET the URL — Google returns a JSON object with an "items" array
 *   4. Map each item to { title, link, snippet } and format as Markdown
 *   5. Return the Markdown string inside an MCP content block
 *
 * Google API response shape (simplified):
 * {
 *   searchInformation: { totalResults, formattedTotalResults, searchTime },
 *   items: [
 *     { title, link, displayLink, snippet, ... },
 *     ...
 *   ]
 * }
 *
 * @async
 * @param {{ query: string; count?: number }} params
 *   @param {string}  params.query       - Search query string
 *   @param {number}  [params.count=5]   - Results to return (1–10, Google's hard limit)
 * @returns {Promise<{ content: Array<{ type: "text"; text: string }> }>}
 *   MCP-compatible result with Markdown-formatted search results
 * @throws {Error} If required env vars are missing or the Google API call fails
 */

async function handleWebSearch({ query, count = DEFAULT_RESULT_COUNT }) {
  // Step 1 – Validate env vars up-front (fail fast with clear messages)
  const apiKey = requireEnv("GOOGLE_API_KEY");
  const searchEngineId = requireEnv("GOOGLE_SEARCH_ENGINE_ID");

  // Step 2 – Build the Google Custom Search URL
  //
  // Google's API only accepts `num` between 1 and 10 per request.
  // If the caller asks for more, we clamp silently rather than throwing.
  const safeCount = Math.min(Math.max(1, count), 10);

  const url = new URL(GOOGLE_SEARCH_URL);
  url.searchParams.set("key", apiKey); // API authentication
  url.searchParams.set("cx", searchEngineId); // Which search engine to use
  url.searchParams.set("q", query); // The actual search query
  url.searchParams.set("num", String(safeCount)); // How many results to return

  // Step 3 – Call Google's API (no special headers needed — auth is in the URL)
  const data = await fetchJson(url.toString());

  // Step 4 – Handle empty results
  // Google omits the "items" key entirely when there are zero results

  const items = data.items ?? [];

  if (items.length === 0) {
    return {
      content: [
        {
          type: "text",
          text:
            `No results found for: "${query}"\n\n` +
            `Try rephrasing your query or broadening the search terms.`,
        },
      ],
    };
  }

  // Step 5 – Format results as readable Markdown
  //
  // Each Google result item contains:
  //   item.title       – the page title
  //   item.link        – the full canonical URL
  //   item.displayLink – the short domain shown in Google (e.g. "stripe.com")
  //   item.snippet     – a short excerpt showing relevant passage from the page
  const lines = [
    `## Google Search Results for: "${query}"`,
    `*Showing ${items.length} of ${data.searchInformation?.formattedTotalResults ?? "?"} results` +
      ` — search time: ${data.searchInformation?.formattedSearchTime ?? "?"}s*`,
    "",
  ];

  items.forEach((item, i) => {
    lines.push(`### ${i + 1}. ${item.title}`);
    lines.push(`**URL:** ${item.link}`);
    lines.push(`**Source:** ${item.displayLink}`);
    if (item.snippet) {
      // Snippets sometimes contain newlines that break Markdown — collapse them
      lines.push(item.snippet.replace(/\n/g, " "));
    }
    lines.push(""); // blank line between each result for readability
  });

  return { content: [{ type: "text", text: lines.join("\n") }] };
}

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------

/**
 * Initialises and starts the MCP server.
 *
 * Steps performed:
 *   1. Create an McpServer instance with name + version metadata
 *   2. Register `get_stripe_status` tool (no input params needed)
 *   3. Register `web_search` tool with Zod-validated input schema
 *   4. Attach StdioServerTransport — host spawns us as a subprocess
 *   5. Call server.connect() — blocks forever, listening for MCP messages
 *
 * @async
 * @returns {Promise<void>}
 */

async function main() {
  // Step 1 – Create the server
  const server = new McpServer({
    name: "stripe-bot-mcp",
    version: "2.0.0",
  });

  // -------------------------------------------------------------------
  // Tool: get_stripe_status
  // No input params – just call it and get live status
  // -------------------------------------------------------------------

  // Step 2 – Register: get_stripe_status
  // Empty schema ({}) because this tool takes zero arguments from the LLM.

  server.tool(
    "get_stripe_status",
    "Fetches the current live status of all Stripe services (API, Dashboard, Webhooks, etc.) " +
      "and reports any active incidents. Use this whenever a customer reports Stripe is down " +
      "or behaving unexpectedly.",
    {}, // ← empty schema = no parameters required
    async () => handleGetStripeStatus(),
  );

  // -------------------------------------------------------------------
  // Tool: web_search
  // Accepts a query string and optional result count
  // -------------------------------------------------------------------

  // Step 3 – Register: web_search
  // Zod schema tells the MCP host exactly what the LLM must pass in.
  // `query` is required; `count` is optional with a sensible default.

  server.tool(
    "web_search",
    "Searches the web using Google Custom Search (free tier: 100 queries/day). " +
      "Useful for finding Stripe documentation, changelogs, error code explanations, " +
      "community answers, or any information not covered by the local knowledge base.",
    {
      query: z
        .string()
        .min(1)
        .describe(
          "The search query string (e.g. 'Stripe webhook signature verification error')",
        ),
      count: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe(
          "Number of results to return (default 5, max 10 — Google hard limit)",
        ),
    },
    async (params) => handleWebSearch(params),
  );

  // Steps 4 & 5 – Connect stdio transport and start the event loop
  // StdioServerTransport pipes MCP JSON-RPC messages through stdin/stdout.
  // After connect() the server is live — it processes calls until the host closes the pipe.
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Always log to stderr — stdout belongs to the MCP protocol, never write to it directly
  console.error(
    "✅ Stripe MCP server v2.0.0 running (stdio) — Google Custom Search enabled",
  );
}

// Entry point
// If startup fails (bad imports, missing SDK, etc.) log clearly and exit non-zero
// so the MCP host knows the server didn't launch successfully
main().catch((err) => {
  console.error("Fatal error during MCP server startup:", err);
  process.exit(1);
});
