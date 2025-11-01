/**
 * MCP Tools Schema Definition
 * This contains the schema for all available MCP tools
 * Used by the AI to decide which tools to call
 */

const AVAILABLE_MCP_TOOLS = [
  {
    name: "convert_currency",
    description: "Convert between currencies and get exchange rates",
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Amount to convert (default: 1)",
        },
        fromCurrency: {
          type: "string",
          description:
            "Source currency code (e.g., USD, EUR, GBP, JPY, NPR, INR)",
        },
        toCurrency: {
          type: "string",
          description:
            "Target currency code (e.g., USD, EUR, GBP, JPY, NPR, INR)",
        },
      },
      required: ["fromCurrency", "toCurrency"],
    },
    examples: [
      {
        query: "what is 100 dollar in nrs",
        arguments: {
          amount: 100,
          fromCurrency: "USD",
          toCurrency: "NPR",
        },
      },
      {
        query: "convert 50 euros to usd",
        arguments: {
          amount: 50,
          fromCurrency: "EUR",
          toCurrency: "USD",
        },
      },
    ],
  },
  {
    name: "search_web",
    description:
      "Search the web for recent PayPal information, updates, outages, or news",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query about PayPal (e.g., 'PayPal outage', 'recent updates', 'new features')",
        },
      },
      required: ["query"],
    },
    examples: [
      {
        query: "is paypal down today",
        arguments: {
          query: "PayPal outage status today",
        },
      },
      {
        query: "what are the recent policy changes",
        arguments: {
          query: "PayPal policy changes updates",
        },
      },
      {
        query: "Australian policy updates",
        arguments: {
          query: "PayPal Australia policy changes",
        },
      },
    ],
  },
  {
    name: "calculate_fees",
    description:
      "Calculate PayPal transaction fees based on amount, transaction type, account type, and payment method",
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Transaction amount",
        },
        transactionType: {
          type: "string",
          enum: ["domestic", "international"],
          description: "Type of transaction (default: domestic)",
        },
        accountType: {
          type: "string",
          enum: ["personal", "business"],
          description: "Type of PayPal account (default: personal)",
        },
        paymentMethod: {
          type: "string",
          enum: ["paypal_balance", "credit_card", "debit_card"],
          description: "Payment method used (default: paypal_balance)",
        },
        currency: {
          type: "string",
          default: "USD",
          description: "Currency code (default: USD)",
        },
      },
      required: ["amount"],
    },
    examples: [
      {
        query: "how much fee for 100 dollars",
        arguments: {
          amount: 100,
          transactionType: "domestic",
          accountType: "personal",
          paymentMethod: "paypal_balance",
          currency: "USD",
        },
      },
    ],
  },
  {
    name: "check_status",
    description:
      "Check PayPal service status and outages. No arguments needed.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    examples: [
      {
        query: "is paypal working",
        arguments: {},
      },
      {
        query: "paypal status",
        arguments: {},
      },
    ],
  },
  {
    name: "estimate_timeline",
    description:
      "Estimate transaction hold timelines based on amount, account age, and risk level",
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Transaction amount",
        },
        accountAge: {
          type: "string",
          enum: ["new_account", "established_account"],
          description: "Account age category (default: established_account)",
        },
        riskLevel: {
          type: "string",
          enum: ["low_risk", "medium_risk", "high_risk"],
          description: "Risk level of the transaction (default: low_risk)",
        },
      },
    },
    examples: [
      {
        query: "how long will my 500 dollar payment be held",
        arguments: {
          amount: 500,
          accountAge: "established_account",
          riskLevel: "medium_risk",
        },
      },
    ],
  },
];

/**
 * Get formatted tools description for AI prompt
 */
function getToolsDescription() {
  let description = "Available MCP Tools:\n\n";

  for (const tool of AVAILABLE_MCP_TOOLS) {
    description += `**${tool.name}**\n`;
    description += `Description: ${tool.description}\n`;
    description += `Schema: ${JSON.stringify(tool.inputSchema, null, 2)}\n`;
    if (tool.examples) {
      description += `Examples:\n`;
      tool.examples.forEach((ex) => {
        description += `  - Query: "${ex.query}" → Arguments: ${JSON.stringify(
          ex.arguments
        )}\n`;
      });
    }
    description += "\n";
  }

  return description;
}

/**
 * Get tool by name
 */
function getToolByName(name) {
  return AVAILABLE_MCP_TOOLS.find((tool) => tool.name === name);
}

module.exports = {
  AVAILABLE_MCP_TOOLS,
  getToolsDescription,
  getToolByName,
};
