import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tavily } from "@tavily/core";
import config from "../../config/config.js";
import { z } from "zod";

// 🧩 Initialize MCP Server
const server = new McpServer({
  name: "mailchimp-agent",
  version: "1.0.0",
  capabilities: { tools: {} },
});

// 🔑 API Key
const apiKey = config.TAVILY_API_KEY;
if (!apiKey) throw new Error("TAVILY_API_KEY missing in config!");
const tavlyClient = tavily({ apiKey });

// Cleaning the raw content
function cleanText(text) {
  if (!text) return "";
  return text
    .replace(
      /(\s*Navigation\s*|Back\s*to\s*top\s*|Related\s*Articles|Footer)/gi,
      ""
    )
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractMainContent(rawContent) {
  const lines = rawContent
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // keep first relevant section, skip nav/footer
  const filtered = lines.filter(
    (line) =>
      !/^(\s*(Home|Menu|Navigation|Contact|Privacy|Cookies))/i.test(line) &&
      line.length > 50
  );

  return filtered.slice(0, 45).join(" ");
}

// Helper: Perform smart Tavily search
async function performRichSearch(query, maxResults = 5) {
  console.error(`Tavily Search -> ${query}`);

  const result = await tavlyClient.search(query, {
    maxResults,
    searchDepth: "advanced",
    includeAnswer: true,
    include_raw_content: true,
  });

  if (!result?.results?.length) {
    return { summary: "No relevant results found.", results: [] };
  }

  // Extract and clean text
  const processed = result.results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: extractMainContent(cleanText(r.content)),
  }));

  // Combine into readable summary
  const combinedText = processed.map((p) => p.snippet).join(" ");
  const summary = combinedText.slice(0, 3500) + "...";

  return { summary, results: processed };
}

// Tool 1: Search Email Trends
server.tool(
  "search_email_trends",
  "Search for latest email marketing trends",
  {
    query: z.string(),
    maxResults: z.number().default(5),
  },
  async ({ query, maxResults }) => {
    const data = await performRichSearch(query, maxResults);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

// Tool 2: Search Best Practices
server.tool(
  "search_email_best_practices",
  "Find latest email marketing best practices",
  {
    query: z.string(),
    maxResults: z.number().default(5),
  },
  async ({ query, maxResults }) => {
    const data = await performRichSearch(query, maxResults);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

// Tool 3: Analyze Email Subject
server.tool(
  "analyze_email_subject",
  "Email Subject Line Analyzer",
  { subject: z.string() },
  async ({ subject }) => {
    const length = subject.length;
    const wordCount = subject.trim().split(/\s+/).length;

    // 🚨 Spam score heuristic
    const spamKeywords = [
      "free",
      "buy now",
      "click here",
      "urgent",
      "offer",
      "win",
      "discount",
      "act now",
      "earn",
      "guarantee",
      "winner",
      "money",
      "$$$",
      "no risk",
      "deal",
    ];
    let spamScore = spamKeywords.reduce(
      (score, word) => score + (subject.toLowerCase().includes(word) ? 20 : 0),
      0
    );

    if (subject === subject.toUpperCase() && wordCount > 1) spamScore += 15;
    const exclamations = (subject.match(/!/g) || []).length;
    spamScore += exclamations * 5;
    const repeatedWords = (subject.match(/\b(\w+)\b(?=.*\b\1\b)/gi) || [])
      .length;
    spamScore += repeatedWords * 5;
    if (spamScore > 100) spamScore = 100;

    // Readability estimate (simple: shorter sentences better)
    const avgWordLength = subject.replace(/\s+/g, "").length / wordCount;
    const readability =
      avgWordLength < 5 ? "Excellent" : avgWordLength < 7 ? "Good" : "Fair";

    // Tips
    const tips = [];
    if (spamScore > 50)
      tips.push("Reduce spammy words or excessive punctuation.");
    if (length > 60)
      tips.push("Keep subject under 60 characters for better visibility.");
    if (readability !== "Excellent")
      tips.push("Consider shorter words for clarity.");

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              subject,
              length,
              wordCount,
              spamScore,
              readability,
              tips,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tools 4: Send time optimization
server.tool(
  "Send time optimizer",
  "Suggest best days/times for email sends based on industry.",
  { industry: z.string().optional() },
  async ({ industry }) => {
    const industryData = {
      ecommerce: {
        bestDays: ["Tuesday", "Thursday"],
        bestTimes: ["10:00 AM"],
      },
      software: {
        bestDays: ["Tuesday", "Thursday"],
        bestTimes: ["2:00 PM – 3:00 PM"],
      },
      saas: {
        bestDays: ["Tuesday", "Thursday"],
        bestTimes: ["2:00 PM – 3:00 PM"],
      },
      marketing: {
        bestDays: ["Wednesday"],
        bestTimes: ["4:00 PM"],
      },
      retail: {
        bestDays: ["Thursday"],
        bestTimes: ["8:00 AM – 10:00 AM"],
      },
      hospitality: {
        bestDays: ["Thursday"],
        bestTimes: ["8:00 AM – 10:00 AM"],
      },
      b2b: {
        bestDays: ["Tuesday", "Wednesday", "Thursday"],
        bestTimes: ["9:00 AM – 11:00 AM"],
      },
      default: {
        bestDays: ["Tuesday", "Wednesday", "Thursday"],
        bestTimes: ["9:00 AM – 2:00 PM"],
      },
    };

    // 🧩 Detect industry by keywords (NLP-lite)
    function detectIndustry(input = "") {
      const text = input.toLowerCase();
      if (text.includes("ecommerce")) return "ecommerce";
      if (text.includes("software") || text.includes("saas")) return "software";
      if (text.includes("marketing")) return "marketing";
      if (text.includes("hospitality") || text.includes("retail"))
        return "hospitality";
      if (text.includes("b2b")) return "b2b";
      return "default";
    }

    const key = detectIndustry(industry);
    const data = industryData[key] || industryData.default;

    const generalTips = [
      "Tuesday to Thursday are usually the best-performing days for engagement.",
      "Mid-morning (around 10 AM) often yields high open rates.",
      "Avoid weekends or late nights unless your audience is global or specific to leisure industries.",
    ];

    const advancedTips = [
      "Use your ESP's Send Time Optimization (STO) feature if available — it uses AI to personalize send times.",
      "Run A/B tests by sending the same campaign at different times to see which performs best.",
      "Track open and click-through rates to build a data-driven timing strategy.",
    ];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              industry: key,
              bestDays: data.bestDays,
              bestTimes: data.bestTimes,
              generalTips,
              advancedTips,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tools 5: List growth calculator
server.tool(
  "email_list_growth_simple",
  "Calculate email list growth rate and projected list size.",
  {
    startingSubscribers: z.number().min(1, "Must have at least 1 subscriber"),
    newSubscribers: z.number().min(0),
    unsubscribes: z.number().min(0),
  },
  async ({ startingSubscribers, newSubscribers, unsubscribes }) => {
    const netGrowth = newSubscribers - unsubscribes;
    const growthRatePercent = ((netGrowth / startingSubscribers) * 100).toFixed(
      2
    );

    let insight = "";
    if (growthRatePercent > 5) {
      insight = "Excellent growth! Your list is expanding rapidly.";
    } else if (growthRatePercent > 0) {
      insight = "Positive growth. Keep optimizing your signup strategies.";
    } else {
      insight =
        "Negative growth. Review your content or frequency to reduce unsubscribes.";
    }

    const tips = [
      "Offer clear incentives to attract new subscribers.",
      "Make signup forms easy and accessible.",
      "Send valuable content to retain subscribers and reduce unsubscribes.",
      "Promote your list on social media and website.",
    ];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              startingSubscribers,
              newSubscribers,
              unsubscribes,
              netGrowth,
              "email list growth rate": `${growthRatePercent}%`,
              insight,
              tips,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Start MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ MCP Server running...");
}

main();
