/**
 * Simple Stripe Integration Test Script
 * Verifies that Stripe is configured correctly
 */

require("dotenv").config();
const { isStripeConfigured } = require("../services/stripeService");
const config = require("../utils/config");

console.log("🧪 Testing Stripe Integration Setup...\n");

// Check configuration
console.log("📋 Configuration Check:");
console.log(
  `   STRIPE_SECRET_KEY: ${config.STRIPE_SECRET_KEY ? "✅ Set" : "❌ Not set"}`
);
console.log(
  `   STRIPE_PUBLISHABLE_KEY: ${
    config.STRIPE_PUBLISHABLE_KEY ? "✅ Set" : "❌ Not set"
  }`
);
console.log(
  `   STRIPE_WEBHOOK_SECRET: ${
    config.STRIPE_WEBHOOK_SECRET ? "✅ Set" : "⚠️  Not set (optional for now)"
  }`
);
console.log(`   STRIPE_API_VERSION: ${config.STRIPE_API_VERSION}\n`);

// Check if Stripe is configured
if (isStripeConfigured()) {
  console.log("✅ Stripe is configured and ready!");
  console.log("\n📝 Next steps:");
  console.log("   1. Start your server: npm run dev");
  console.log("   2. Create a booking: POST /api/bookings");
  console.log("   3. Check booking for payment_intent_id and client_secret");
  console.log("   4. Test webhook (optional): Use Stripe CLI");
} else {
  console.log("❌ Stripe is not configured yet!");
  console.log("\n📝 To configure:");
  console.log("   1. Get keys from: https://dashboard.stripe.com/test/apikeys");
  console.log("   2. Add to .env file:");
  console.log("      STRIPE_SECRET_KEY=sk_test_...");
  console.log("      STRIPE_PUBLISHABLE_KEY=pk_test_...");
  console.log("   3. Run this script again to verify");
}

console.log("\n🔗 Useful Links:");
console.log("   - Stripe Dashboard: https://dashboard.stripe.com/test");
console.log("   - API Keys: https://dashboard.stripe.com/test/apikeys");
console.log("   - Test Cards: https://stripe.com/docs/testing");
console.log("   - Stripe CLI: https://stripe.com/docs/stripe-cli");
