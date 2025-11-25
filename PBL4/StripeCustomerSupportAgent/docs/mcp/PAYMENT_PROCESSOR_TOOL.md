# Payment Processor MCP Tool

A comprehensive MCP (Model Context Protocol) tool for processing Stripe payments, managing customers, and handling payment operations in test mode.

## 🚀 Features

### Payment Operations

- **Create Payment Intents**: Process payments with customizable amounts and currencies
- **Capture Payments**: Capture authorized payments
- **Cancel Payments**: Void payment intents
- **Create Refunds**: Process full or partial refunds
- **List Operations**: Retrieve payment intents, customers, and refunds

### Customer Management

- **Create Customers**: Add new customers with metadata
- **List Customers**: Retrieve customer information
- **Customer Search**: Find customers by email

### Payment Method Management

- **Create Payment Methods**: Add cards and other payment methods
- **List Payment Methods**: Retrieve customer payment methods
- **Test Card Support**: Use Stripe's test card numbers for safe testing

## 🛠️ Setup

### 1. Environment Configuration

Add your Stripe test keys to your `.env` file:

```bash
# Stripe Configuration (SECURE - Never share these keys!)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Dependencies

The tool requires the following packages:

- `stripe` - Official Stripe SDK
- `date-fns` - Date formatting utilities

### 3. MCP Configuration

The tool is configured in `config/mcp-tools.json`:

```json
{
  "payment_processor": {
    "enabled": true,
    "name": "Payment Processor Tool",
    "description": "Process payments, refunds, and manage payment methods using Stripe API",
    "dependencies": ["stripe", "date-fns"],
    "apiKeys": ["STRIPE_SECRET_KEY"]
  }
}
```

## 📋 Usage Examples

### Creating a Payment Intent

```javascript
const result = await paymentTool.execute("create payment", {
  amount: 2000, // $20.00 in cents
  currency: "usd",
  customer_id: "cus_test123",
  description: "Test payment",
  metadata: {
    order_id: "order_123",
  },
});
```

### Processing a Refund

```javascript
const result = await paymentTool.execute("create refund", {
  payment_intent_id: "pi_test123",
  amount: 1000, // $10.00 refund
  reason: "requested_by_customer",
  metadata: {
    refund_reason: "defective_product",
  },
});
```

### Creating a Customer

```javascript
const result = await paymentTool.execute("create customer", {
  email: "customer@example.com",
  name: "John Doe",
  description: "VIP Customer",
  metadata: {
    tier: "premium",
    source: "website",
  },
});
```

### Adding a Payment Method

```javascript
const result = await paymentTool.execute("create payment method", {
  type: "card",
  card: {
    number: "4242424242424242",
    exp_month: 12,
    exp_year: 2025,
    cvc: "123",
  },
  billing_details: {
    name: "John Doe",
    email: "customer@example.com",
  },
});
```

## 🧪 Test Cards

Stripe provides test card numbers for safe testing:

| Card Number        | Description               |
| ------------------ | ------------------------- |
| `4242424242424242` | Visa - Success            |
| `4000000000000002` | Visa - Declined           |
| `4000000000009995` | Visa - Insufficient funds |
| `4000000000009987` | Visa - Lost card          |
| `4000000000009979` | Visa - Stolen card        |
| `4000000000000069` | Visa - Expired card       |
| `4000000000000127` | Visa - Incorrect CVC      |
| `4000000000000119` | Visa - Processing error   |

## 🔧 API Operations

### Payment Intent Operations

| Operation                | Description                   | Required Parameters  |
| ------------------------ | ----------------------------- | -------------------- |
| `create_payment_intent`  | Create a new payment intent   | `amount`, `currency` |
| `capture_payment_intent` | Capture an authorized payment | `payment_intent_id`  |
| `cancel_payment_intent`  | Cancel a payment intent       | `payment_intent_id`  |

### Refund Operations

| Operation       | Description     | Required Parameters                |
| --------------- | --------------- | ---------------------------------- |
| `create_refund` | Create a refund | `charge_id` or `payment_intent_id` |
| `list_refunds`  | List refunds    | None                               |

### Customer Operations

| Operation         | Description       | Required Parameters |
| ----------------- | ----------------- | ------------------- |
| `create_customer` | Create a customer | `email` or `name`   |
| `list_customers`  | List customers    | None                |

### Payment Method Operations

| Operation               | Description           | Required Parameters |
| ----------------------- | --------------------- | ------------------- |
| `create_payment_method` | Create payment method | `type`, `card`      |
| `list_payment_methods`  | List payment methods  | `customer_id`       |

## 🎯 Query Recognition

The tool automatically detects payment-related queries:

- **Payment Keywords**: "payment", "charge", "transaction"
- **Refund Keywords**: "refund", "return money"
- **Capture Keywords**: "capture", "void", "cancel"
- **Customer Keywords**: "customer", "client"
- **Payment Method Keywords**: "payment method", "card"

## 📊 Response Format

### Successful Operations

```json
{
  "success": true,
  "result": {
    "operation": "create_payment_intent",
    "payment_intent": {
      "id": "pi_test123",
      "amount": 2000,
      "currency": "usd",
      "status": "requires_payment_method",
      "client_secret": "pi_test123_secret_abc123"
    },
    "success": true
  },
  "confidence": 0.9,
  "message": "✅ Payment Operation Successful\n\n**Operation:** Create a new payment intent\n\n**Payment Intent Created:**\n• ID: `pi_test123`\n• Amount: $20.00 USD\n• Status: requires_payment_method\n• Client Secret: `pi_test123_secret_abc123`"
}
```

### Error Handling

```json
{
  "success": false,
  "result": null,
  "confidence": 0,
  "error": "Payment intent ID is required for capture"
}
```

## 🔒 Security Considerations

1. **Test Mode Only**: This tool is designed for Stripe test mode only
2. **API Key Security**: Never expose your secret key in client-side code
3. **Environment Variables**: Store keys securely in environment variables
4. **Webhook Security**: Use webhook secrets to verify Stripe events

## 🚨 Error Handling

The tool handles various Stripe API errors:

- **Authentication Errors**: Invalid API keys
- **Validation Errors**: Missing required parameters
- **Rate Limiting**: Automatic retry with exponential backoff
- **Network Errors**: Connection timeout handling

## 📈 Confidence Scoring

The tool provides confidence scores based on:

- **Operation Success**: Higher confidence for successful operations
- **Operation Type**: Create operations get higher confidence
- **Data Completeness**: More complete data increases confidence
- **Error Handling**: Failed operations get lower confidence

## 🔄 Integration with Other MCP Tools

The Payment Processor Tool works seamlessly with other MCP tools:

- **Calculator Tool**: For fee calculations and currency conversions
- **Status Checker Tool**: For monitoring Stripe API status
- **DateTime Tool**: For payment scheduling and time-based operations

## 📝 Testing

Run the test script to verify functionality:

```bash
node scripts/testPaymentProcessor.js
```

This will test:

1. Customer creation
2. Payment method creation
3. Payment intent creation
4. List operations
5. Error handling

## 🎉 Next Steps

1. **Webhook Integration**: Add webhook event handling
2. **Subscription Management**: Add recurring payment support
3. **Advanced Reporting**: Add financial reporting capabilities
4. **Multi-currency Support**: Enhanced currency handling
5. **Fraud Detection**: Add risk assessment features

## 📚 Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Security Best Practices](https://stripe.com/docs/security)
