import mcpClient from "./mcpClient.js";

(async () => {
  try {
    const tools = await mcpClient.listTools();
    console.log(
      "Available tools:",
      tools.map((t) => t.name)
    );

    const trends = await mcpClient.callTool("search_email_trends", {
      query: "2025 email marketing trends",
      maxResults: 2,
    });
    console.log("Trends:", trends);

    const analysis = await mcpClient.callTool("analyze_email_subject", {
      subject: "Limited time discount – Act now!",
    });
    console.log("Subject analysis:", analysis);
  } catch (e) {
    console.error("Test failed:", e);
    process.exit(1);
  } finally {
    mcpClient.cleanup();
  }
})();
