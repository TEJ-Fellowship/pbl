import Stripe from "stripe";
import { format } from "date-fns";

/**
 * Payment Processor Tool for Stripe Payment Operations
 * Handles payment intents, refunds, captures, and payment method management
 */
class PaymentProcessorTool {
  constructor() {
    this.name = "payment_processor";
    this.description =
      "Process payments, refunds, and manage payment methods using Stripe API";
    this.stripe = null;
    this.apiKey = process.env.STRIPE_SECRET_KEY;
    this.lastCheck = null;
    this.cache = null;
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
  }

  /**
   * Initialize Stripe instance
   */
  initializeStripe() {
    if (!this.stripe && this.apiKey) {
      this.stripe = new Stripe(this.apiKey, {
        apiVersion: "2023-10-16",
        timeout: 30000,
      });
    }
  }

  /**
   * Execute payment operation
   * @param {string} query - User query
   * @param {Object} params - Operation parameters
   * @returns {Object} - Operation result with confidence score
   */
  async execute(query, params = {}) {
    try {
      console.log(`💳 Payment Processor Tool: Processing "${query}"`);

      this.initializeStripe();

      if (!this.stripe) {
        return {
          success: false,
          result: null,
          confidence: 0,
          message: "Stripe API key not configured",
        };
      }

      const operation = this.determineOperation(query, params);
      const result = await this.performOperation(operation, params);
      const confidence = this.calculateConfidence(operation, result);

      return {
        success: true,
        result: result,
        confidence,
        message: this.generateResponse(operation, result, query),
      };
    } catch (error) {
      console.error("❌ Payment Processor Tool Error:", error);
      return {
        success: false,
        result: null,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Determine the operation type from query
   * @param {string} query - User query
   * @param {Object} params - Operation parameters
   * @returns {Object} - Operation details
   */
  determineOperation(query, params) {
    const queryLower = query.toLowerCase();

    // Payment Method Operations (check first to avoid conflicts)
    if (
      queryLower.includes("payment method") &&
      queryLower.includes("create")
    ) {
      return {
        type: "create_payment_method",
        description: "Create a payment method",
      };
    }

    if (queryLower.includes("payment method") && queryLower.includes("list")) {
      return {
        type: "list_payment_methods",
        description: "List payment methods",
      };
    }

    // Payment Intent Operations
    if (
      queryLower.includes("create payment") ||
      queryLower.includes("charge")
    ) {
      return {
        type: "create_payment_intent",
        description: "Create a new payment intent",
      };
    }

    if (
      queryLower.includes("capture payment") ||
      queryLower.includes("capture")
    ) {
      return {
        type: "capture_payment_intent",
        description: "Capture a payment intent",
      };
    }

    if (queryLower.includes("cancel payment") || queryLower.includes("void")) {
      return {
        type: "cancel_payment_intent",
        description: "Cancel a payment intent",
      };
    }

    // Refund Operations
    if (queryLower.includes("refund") || queryLower.includes("return money")) {
      return {
        type: "create_refund",
        description: "Create a refund",
      };
    }

    if (
      queryLower.includes("list refunds") ||
      queryLower.includes("get refunds")
    ) {
      return {
        type: "list_refunds",
        description: "List refunds",
      };
    }

    // Customer Operations
    if (queryLower.includes("customer") && queryLower.includes("create")) {
      return {
        type: "create_customer",
        description: "Create a customer",
      };
    }

    if (queryLower.includes("customer") && queryLower.includes("list")) {
      return {
        type: "list_customers",
        description: "List customers",
      };
    }

    // Default to list payment intents
    return {
      type: "list_payment_intents",
      description: "List payment intents",
    };
  }

  /**
   * Perform the determined operation
   * @param {Object} operation - Operation details
   * @param {Object} params - Operation parameters
   * @returns {Object} - Operation result
   */
  async performOperation(operation, params) {
    try {
      switch (operation.type) {
        case "create_payment_intent":
          return await this.createPaymentIntent(params);
        case "capture_payment_intent":
          return await this.capturePaymentIntent(params);
        case "cancel_payment_intent":
          return await this.cancelPaymentIntent(params);
        case "create_refund":
          return await this.createRefund(params);
        case "list_refunds":
          return await this.listRefunds(params);
        case "create_payment_method":
          return await this.createPaymentMethod(params);
        case "list_payment_methods":
          return await this.listPaymentMethods(params);
        case "create_customer":
          return await this.createCustomer(params);
        case "list_customers":
          return await this.listCustomers(params);
        case "list_payment_intents":
          return await this.listPaymentIntents(params);
        default:
          throw new Error(`Unknown operation: ${operation.type}`);
      }
    } catch (error) {
      console.error(`❌ Operation ${operation.type} failed:`, error);
      throw error;
    }
  }

  /**
   * Create a payment intent
   * @param {Object} params - Payment parameters
   * @returns {Object} - Payment intent result
   */
  async createPaymentIntent(params) {
    const {
      amount = 2000, // $20.00 in cents
      currency = "usd",
      customer_id,
      payment_method_id,
      description = "Test payment via MCP tool",
      metadata = {},
    } = params;

    const paymentIntentData = {
      amount,
      currency,
      description,
      metadata: {
        source: "mcp_payment_processor",
        ...metadata,
      },
    };

    if (customer_id) {
      paymentIntentData.customer = customer_id;
    }

    if (payment_method_id) {
      paymentIntentData.payment_method = payment_method_id;
      paymentIntentData.confirmation_method = "manual";
      paymentIntentData.confirm = true;
    }

    const paymentIntent = await this.stripe.paymentIntents.create(
      paymentIntentData
    );

    return {
      operation: "create_payment_intent",
      payment_intent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret,
        description: paymentIntent.description,
        created: format(
          new Date(paymentIntent.created * 1000),
          "yyyy-MM-dd HH:mm:ss"
        ),
      },
      success: true,
    };
  }

  /**
   * Capture a payment intent
   * @param {Object} params - Capture parameters
   * @returns {Object} - Capture result
   */
  async capturePaymentIntent(params) {
    const { payment_intent_id, amount_to_capture } = params;

    if (!payment_intent_id) {
      throw new Error("Payment intent ID is required for capture");
    }

    const captureData = {};
    if (amount_to_capture) {
      captureData.amount_to_capture = amount_to_capture;
    }

    const paymentIntent = await this.stripe.paymentIntents.capture(
      payment_intent_id,
      captureData
    );

    return {
      operation: "capture_payment_intent",
      payment_intent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        amount_captured: paymentIntent.amount_captured,
        status: paymentIntent.status,
        created: format(
          new Date(paymentIntent.created * 1000),
          "yyyy-MM-dd HH:mm:ss"
        ),
      },
      success: true,
    };
  }

  /**
   * Cancel a payment intent
   * @param {Object} params - Cancel parameters
   * @returns {Object} - Cancel result
   */
  async cancelPaymentIntent(params) {
    const { payment_intent_id } = params;

    if (!payment_intent_id) {
      throw new Error("Payment intent ID is required for cancellation");
    }

    const paymentIntent = await this.stripe.paymentIntents.cancel(
      payment_intent_id
    );

    return {
      operation: "cancel_payment_intent",
      payment_intent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        created: format(
          new Date(paymentIntent.created * 1000),
          "yyyy-MM-dd HH:mm:ss"
        ),
      },
      success: true,
    };
  }

  /**
   * Create a refund
   * @param {Object} params - Refund parameters
   * @returns {Object} - Refund result
   */
  async createRefund(params) {
    const {
      charge_id,
      payment_intent_id,
      amount,
      reason = "requested_by_customer",
      metadata = {},
    } = params;

    if (!charge_id && !payment_intent_id) {
      throw new Error(
        "Either charge_id or payment_intent_id is required for refund"
      );
    }

    const refundData = {
      reason,
      metadata: {
        source: "mcp_payment_processor",
        ...metadata,
      },
    };

    if (charge_id) {
      refundData.charge = charge_id;
    } else if (payment_intent_id) {
      refundData.payment_intent = payment_intent_id;
    }

    if (amount) {
      refundData.amount = amount;
    }

    const refund = await this.stripe.refunds.create(refundData);

    return {
      operation: "create_refund",
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: format(new Date(refund.created * 1000), "yyyy-MM-dd HH:mm:ss"),
      },
      success: true,
    };
  }

  /**
   * List refunds
   * @param {Object} params - List parameters
   * @returns {Object} - Refunds list
   */
  async listRefunds(params) {
    const { limit = 10, starting_after } = params;

    const listParams = { limit };
    if (starting_after) {
      listParams.starting_after = starting_after;
    }

    const refunds = await this.stripe.refunds.list(listParams);

    return {
      operation: "list_refunds",
      refunds: refunds.data.map((refund) => ({
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: format(new Date(refund.created * 1000), "yyyy-MM-dd HH:mm:ss"),
      })),
      has_more: refunds.has_more,
      success: true,
    };
  }

  /**
   * Create a payment method
   * @param {Object} params - Payment method parameters
   * @returns {Object} - Payment method result
   */
  async createPaymentMethod(params) {
    const { type = "card", customer_id, billing_details = {} } = params;

    // For test mode, we'll create a setup intent to properly handle payment methods
    // This is the recommended approach for test environments
    const setupIntent = await this.stripe.setupIntents.create({
      customer: customer_id,
      payment_method_types: [type],
      usage: "off_session",
    });

    // Return the setup intent details instead of trying to create payment method directly
    return {
      operation: "create_payment_method",
      setup_intent: {
        id: setupIntent.id,
        client_secret: setupIntent.client_secret,
        status: setupIntent.status,
        payment_method_types: setupIntent.payment_method_types,
        usage: setupIntent.usage,
        created: format(
          new Date(setupIntent.created * 1000),
          "yyyy-MM-dd HH:mm:ss"
        ),
      },
      success: true,
      message:
        "Setup intent created. Use client_secret to complete payment method setup on frontend.",
    };
  }

  /**
   * List payment methods
   * @param {Object} params - List parameters
   * @returns {Object} - Payment methods list
   */
  async listPaymentMethods(params) {
    const { customer_id, type = "card", limit = 10 } = params;

    if (!customer_id) {
      throw new Error("Customer ID is required to list payment methods");
    }

    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customer_id,
      type,
      limit,
    });

    return {
      operation: "list_payment_methods",
      payment_methods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
            }
          : null,
        created: format(new Date(pm.created * 1000), "yyyy-MM-dd HH:mm:ss"),
      })),
      success: true,
    };
  }

  /**
   * Create a customer
   * @param {Object} params - Customer parameters
   * @returns {Object} - Customer result
   */
  async createCustomer(params) {
    const {
      email,
      name,
      description = "Customer created via MCP tool",
      metadata = {},
    } = params;

    const customer = await this.stripe.customers.create({
      email,
      name,
      description,
      metadata: {
        source: "mcp_payment_processor",
        ...metadata,
      },
    });

    return {
      operation: "create_customer",
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        description: customer.description,
        created: format(
          new Date(customer.created * 1000),
          "yyyy-MM-dd HH:mm:ss"
        ),
      },
      success: true,
    };
  }

  /**
   * List customers
   * @param {Object} params - List parameters
   * @returns {Object} - Customers list
   */
  async listCustomers(params) {
    const { limit = 10, email } = params;

    const listParams = { limit };
    if (email) {
      listParams.email = email;
    }

    const customers = await this.stripe.customers.list(listParams);

    return {
      operation: "list_customers",
      customers: customers.data.map((customer) => ({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        description: customer.description,
        created: format(
          new Date(customer.created * 1000),
          "yyyy-MM-dd HH:mm:ss"
        ),
      })),
      has_more: customers.has_more,
      success: true,
    };
  }

  /**
   * List payment intents
   * @param {Object} params - List parameters
   * @returns {Object} - Payment intents list
   */
  async listPaymentIntents(params) {
    const { limit = 10, customer_id } = params;

    const listParams = { limit };
    if (customer_id) {
      listParams.customer = customer_id;
    }

    const paymentIntents = await this.stripe.paymentIntents.list(listParams);

    return {
      operation: "list_payment_intents",
      payment_intents: paymentIntents.data.map((pi) => ({
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        description: pi.description,
        created: format(new Date(pi.created * 1000), "yyyy-MM-dd HH:mm:ss"),
      })),
      has_more: paymentIntents.has_more,
      success: true,
    };
  }

  /**
   * Calculate confidence score for operation
   * @param {Object} operation - Operation details
   * @param {Object} result - Operation result
   * @returns {number} - Confidence score (0-1)
   */
  calculateConfidence(operation, result) {
    let confidence = 0.8; // Base confidence for successful operations

    // Higher confidence for successful operations
    if (result.success) confidence += 0.1;

    // Lower confidence for list operations (less specific)
    if (operation.type.includes("list")) confidence -= 0.1;

    // Higher confidence for create operations
    if (operation.type.includes("create")) confidence += 0.1;

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Generate human-readable response
   * @param {Object} operation - Operation details
   * @param {Object} result - Operation result
   * @param {string} query - Original query
   * @returns {string} - Formatted response
   */
  generateResponse(operation, result, query) {
    let response = "";

    if (!result.success) {
      return `❌ **Payment Operation Failed**\n\nOperation: ${
        operation.description
      }\nError: ${result.error || "Unknown error"}`;
    }

    response += `✅ **Payment Operation Successful**\n\n`;
    response += `**Operation:** ${operation.description}\n\n`;

    // Format result based on operation type
    switch (operation.type) {
      case "create_payment_intent":
        response += `**Payment Intent Created:**\n`;
        response += `• ID: \`${result.payment_intent.id}\`\n`;
        response += `• Amount: $${(result.payment_intent.amount / 100).toFixed(
          2
        )} ${result.payment_intent.currency.toUpperCase()}\n`;
        response += `• Status: ${result.payment_intent.status}\n`;
        response += `• Client Secret: \`${result.payment_intent.client_secret}\`\n`;
        break;

      case "capture_payment_intent":
        response += `**Payment Captured:**\n`;
        response += `• ID: \`${result.payment_intent.id}\`\n`;
        response += `• Amount Captured: $${(
          result.payment_intent.amount_captured / 100
        ).toFixed(2)}\n`;
        response += `• Status: ${result.payment_intent.status}\n`;
        break;

      case "create_refund":
        response += `**Refund Created:**\n`;
        response += `• ID: \`${result.refund.id}\`\n`;
        response += `• Amount: $${(result.refund.amount / 100).toFixed(
          2
        )} ${result.refund.currency.toUpperCase()}\n`;
        response += `• Status: ${result.refund.status}\n`;
        response += `• Reason: ${result.refund.reason}\n`;
        break;

      case "create_customer":
        response += `**Customer Created:**\n`;
        response += `• ID: \`${result.customer.id}\`\n`;
        response += `• Email: ${result.customer.email || "N/A"}\n`;
        response += `• Name: ${result.customer.name || "N/A"}\n`;
        break;

      default:
        if (result.payment_intents) {
          response += `**Payment Intents (${result.payment_intents.length}):**\n`;
          result.payment_intents.forEach((pi, index) => {
            response += `${index + 1}. \`${pi.id}\` - $${(
              pi.amount / 100
            ).toFixed(2)} ${pi.currency.toUpperCase()} (${pi.status})\n`;
          });
        } else if (result.customers) {
          response += `**Customers (${result.customers.length}):**\n`;
          result.customers.forEach((customer, index) => {
            response += `${index + 1}. \`${customer.id}\` - ${
              customer.email || "N/A"
            } (${customer.name || "N/A"})\n`;
          });
        } else if (result.refunds) {
          response += `**Refunds (${result.refunds.length}):**\n`;
          result.refunds.forEach((refund, index) => {
            response += `${index + 1}. \`${refund.id}\` - $${(
              refund.amount / 100
            ).toFixed(2)} ${refund.currency.toUpperCase()} (${
              refund.status
            })\n`;
          });
        }
    }

    return response.trim();
  }

  /**
   * Check if this tool should be used for the given query
   * @param {string} query - User query
   * @returns {boolean} - Whether to use this tool
   */
  shouldUse(query) {
    const paymentIndicators = [
      /payment|charge|transaction/,
      /refund|return money/,
      /capture|void|cancel/,
      /payment method|card/,
      /customer|client/,
      /stripe.*payment|stripe.*charge/,
    ];

    return paymentIndicators.some((pattern) =>
      pattern.test(query.toLowerCase())
    );
  }
}

export default PaymentProcessorTool;
