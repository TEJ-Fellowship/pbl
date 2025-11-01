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
      "Calculate PayPal transaction fees based on amount, transaction type, account type, and payment method. Uses actual fee data from PayPal's fee tables. IMPORTANT: Extract payment type from query (e.g., 'PayPal Checkout', 'QR code Transactions', 'Standard Credit and Debit Card Payments', 'PayPal Pay Later', 'PayPal balance or a bank account', 'Cards'). If query mentions 'sending money', 'send to family', 'PayPal balance', or 'bank account' → use paymentType: 'PayPal balance or a bank account' and accountType: 'personal'. If query mentions a specific payment type, ALWAYS include it in paymentType argument.",
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Transaction amount (required)",
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
          description: "Payment method used (legacy, prefer paymentType)",
        },
        paymentType: {
          type: "string",
          description:
            "Payment type (e.g., 'PayPal Checkout', 'QR code Transactions', 'Cards', 'Cryptocurrency', 'Donations', 'PayPal balance or a bank account', etc.). For 'sending money' queries with PayPal balance, use 'PayPal balance or a bank account'",
        },
        currency: {
          type: "string",
          description:
            "Currency code (USD, EUR, GBP, JPY, CAD, AUD, etc.) - default: USD",
        },
        feeCategory: {
          type: "string",
          enum: ["merchant", "consumer", "auto"],
          description:
            "Fee category to use (default: auto - uses merchant for business, consumer for personal)",
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
          currency: "USD",
        },
      },
      {
        query: "calculate fee for $150 crypto purchase",
        arguments: {
          amount: 150,
          paymentType: "Cryptocurrency",
          accountType: "personal",
          currency: "USD",
        },
      },
      {
        query: "what are the fees for 500 euros merchant payment",
        arguments: {
          amount: 500,
          accountType: "business",
          paymentType: "PayPal Checkout",
          currency: "EUR",
        },
      },
      {
        query: "fee for sending 50 dollars using card",
        arguments: {
          amount: 50,
          paymentType: "Cards",
          accountType: "personal",
          transactionType: "domestic",
          currency: "USD",
        },
      },
      {
        query: "calculate merchant fee for $250 PayPal Checkout in USD",
        arguments: {
          amount: 250,
          accountType: "business",
          paymentType: "PayPal Checkout",
          currency: "USD",
        },
      },
      {
        query: "what's the fee for 100 dollars QR code transaction",
        arguments: {
          amount: 100,
          accountType: "business",
          paymentType: "QR code Transactions",
          currency: "USD",
        },
      },
      {
        query: "fee for 200 credit card payment from business account",
        arguments: {
          amount: 200,
          accountType: "business",
          paymentType: "Standard Credit and Debit Card Payments",
          currency: "USD",
        },
      },
      {
        query:
          "What's the fee for sending $200 to family using my PayPal balance?",
        arguments: {
          amount: 200,
          accountType: "personal",
          paymentType: "PayPal balance or a bank account",
          feeCategory: "consumer",
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
