import { spawn } from "child_process";
// const path = require("path");
import path from "path";
import { fileURLToPath } from "url";

// Emulate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple JSON-RPC 2.0 client over stdio for a single MCP server
class MCPClient {
  constructor(options = {}) {
    this.serverScriptPath =
      options.serverScriptPath ||
      path.join(__dirname, "..", "mcpServer", "mcpServer.js");
    this.initTimeoutMs = options.initTimeoutMs || 10000;
    this.requestTimeoutMs = options.requestTimeoutMs || 60000;

    this.mcpProcess = null;
    this.requestId = 1;
    this.pendingRequests = new Map();
    this.buffer = ""; // accumulate stdout chunks until we have full lines
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    this.mcpProcess = spawn("node", [this.serverScriptPath], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.mcpProcess.on("error", (err) => {
      // Reject all pending requests if process errors
      for (const [, { reject }] of this.pendingRequests) {
        reject(err);
      }
      this.pendingRequests.clear();
    });

    this.mcpProcess.stderr.on("data", (data) => {
      // Keep stderr for observability, do not throw
      const text = data.toString();
      if (text?.trim()) {
        console.error(`MCP Server STDERR: ${text.trim()}`);
      }
    });

    this.mcpProcess.stdout.on("data", (data) => {
      this.buffer += data.toString();
      const lines = this.buffer.split("\n");
      // keep the last partial line in buffer
      this.buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let message;
        try {
          message = JSON.parse(trimmed);
        } catch (e) {
          // Skip non-JSON lines
          continue;
        }
        if (message && typeof message.id !== "undefined") {
          const pending = this.pendingRequests.get(message.id);
          if (pending) {
            this.pendingRequests.delete(message.id);
            pending.resolve(message);
          }
        }
      }
    });

    // Give the server a brief moment to boot before initialize
    await new Promise((r) => setTimeout(r, 250));

    // Initialize handshake per MCP
    const initResp = await this._sendRequest(
      "initialize",
      {
        protocolVersion: "1.0.0",
        capabilities: {},
        clientInfo: {
          name: "mailchimp-support-client",
          version: "1.0.0",
        },
      },
      this.initTimeoutMs
    );

    if (initResp?.error) {
      throw new Error(
        `MCP initialize error: ${JSON.stringify(initResp.error)}`
      );
    }

    this.initialized = true;
  }

  async listTools() {
    await this.init();
    const resp = await this._sendRequest("tools/list", {});
    if (resp?.error) {
      throw new Error(`tools/list failed: ${JSON.stringify(resp.error)}`);
    }
    const tools = resp?.result?.tools || [];
    return tools;
  }

  async callTool(toolName, args = {}) {
    if (!toolName || typeof toolName !== "string") {
      throw new Error("toolName must be a non-empty string");
    }
    await this.init();
    const resp = await this._sendRequest("tools/call", {
      name: toolName,
      arguments: args,
    });
    if (resp?.error) {
      throw new Error(`tools/call failed: ${JSON.stringify(resp.error)}`);
    }
    return resp?.result;
  }

  async _sendRequest(method, params = {}, timeoutMs = this.requestTimeoutMs) {
    if (!this.mcpProcess || !this.mcpProcess.stdin.writable) {
      throw new Error("MCP process is not running or stdin not writable");
    }

    const id = this.requestId++;
    const request = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    const promise = new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      try {
        this.mcpProcess.stdin.write(JSON.stringify(request) + "\n");
      } catch (e) {
        this.pendingRequests.delete(id);
        reject(e);
      }
    });

    const timeout = new Promise((_, reject) => {
      const t = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
        }
        reject(new Error(`${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      // Attach handle for potential future cancellation patterns
      // eslint-disable-next-line no-unused-expressions
      t;
    });

    return Promise.race([promise, timeout]);
  }

  cleanup() {
    try {
      for (const [, { reject }] of this.pendingRequests) {
        reject(new Error("MCP client cleanup called"));
      }
      this.pendingRequests.clear();
    } finally {
      if (this.mcpProcess) {
        try {
          this.mcpProcess.kill();
        } catch (_) {
          // ignore
        }
        this.mcpProcess = null;
      }
      this.initialized = false;
    }
  }
}

// Convenience singleton
const mcpClient = new MCPClient();

export default mcpClient;
