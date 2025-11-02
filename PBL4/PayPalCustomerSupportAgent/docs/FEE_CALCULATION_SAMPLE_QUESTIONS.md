# Fee Calculation MCP Tool - Sample Questions

This document contains sample questions that work with the `calculate_fees` MCP tool. The tool uses actual fee data from PayPal's fee structure tables.

## Basic Fee Calculations

### Simple Amount Queries

- "How much fee for 100 dollars?"
- "What's the fee for $150?"
- "Calculate fee for 50 USD"
- "Fee for 200 dollars?"

### With Payment Type

- "How much fee for 100 dollars using PayPal Checkout?"
- "Calculate fee for $150 QR code transaction"
- "What's the fee for 500 dollars with credit card?"
- "Fee for sending 75 dollars using cards?"

## Cryptocurrency Fees (Tiered Structure)

- "What's the fee for $150 crypto purchase?"
- "Calculate fee for cryptocurrency conversion of 100 USD"
- "Fee for buying 75 dollars worth of crypto"
- "How much fee for $250 cryptocurrency purchase?"
- "What are the fees for crypto conversion of 1000 dollars?"

**Note:** Cryptocurrency fees use tiered rates:

- $1.00 - $74.99: 2.20%
- $75.00 - $200.00: 2.00%
- $200.01 - $1000.00: 1.80%
- $1000.01+: 1.50%

## Business/Merchant Fees

- "What are the fees for a $500 merchant payment?"
- "Calculate fee for 1000 dollars business transaction"
- "Fee for $250 commercial transaction"
- "How much fee for merchant payment of 150 dollars?"

## International Transactions

- "What's the fee for sending 100 dollars internationally?"
- "Calculate fee for $200 international payment"
- "Fee for international transfer of 50 dollars"
- "How much fee for cross-border payment of 150 dollars?"

## Different Currencies

- "What's the fee for 100 euros?"
- "Calculate fee for 500 pounds"
- "Fee for 10000 yen transaction"
- "How much fee for 200 Canadian dollars?"
- "Fee for 150 Australian dollars"

## Payment Methods

### Cards

- "Fee for 100 dollars using credit card?"
- "Calculate fee for $150 card payment"
- "What's the fee for debit card transaction of 75 dollars?"

### PayPal Balance/Bank

- "Fee for 100 dollars from PayPal balance?"
- "Calculate fee for $200 bank account payment"
- "Fee for sending money using PayPal balance for 50 dollars"

### QR Code

- "What's the fee for 100 dollars QR code transaction?"
- "Calculate fee for QR payment of $150"

### Donations

- "Fee for 100 dollar donation?"
- "Calculate fee for $250 donation payment"
- "What's the fee for donation transaction of 75 dollars?"

### Venmo

- "Fee for 100 dollars Pay with Venmo?"
- "Calculate fee for $150 Venmo transaction"

## Combination Queries

- "What's the fee for 500 euros business payment using PayPal Checkout?"
- "Calculate fee for $1000 international merchant transaction"
- "Fee for 200 dollars crypto purchase for personal account"
- "How much fee for 150 euros QR code payment?"

## Edge Cases

### Small Amounts

- "Fee for $1 transaction?"
- "Calculate fee for 5 dollars"
- "What's the fee for $10 payment?"

### Large Amounts

- "Fee for $10,000 transaction?"
- "Calculate fee for 50000 dollars"
- "What's the fee for $100,000 payment?"

### Mixed Parameters

- "Fee for 200 dollars personal account international payment using cards?"
- "Calculate fee for $500 business PayPal Checkout transaction"
- "What's the fee for 150 dollars cryptocurrency conversion in EUR?"

## Expected Tool Arguments

The tool will extract and use:

- `amount`: The transaction amount (required)
- `currency`: Currency code (USD, EUR, GBP, etc.) - defaults to USD
- `accountType`: "personal" or "business" (defaults to personal)
- `transactionType`: "domestic" or "international" (defaults to domestic)
- `paymentType`: Specific payment type from fee tables (e.g., "PayPal Checkout", "Cards", "Cryptocurrency", etc.)
- `feeCategory`: "merchant", "consumer", or "auto" (defaults to auto)

## Notes

1. The tool uses actual fee data from PayPal's fee structure tables
2. For tiered fees (like cryptocurrency), it automatically selects the correct tier based on amount
3. Fixed fees are currency-specific and looked up from fee tables
4. International transactions may include additional currency conversion fees
5. The tool supports multiple currencies with automatic conversion where applicable
