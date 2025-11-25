/**
 * Basic Stripe test demonstrating customer-payment relationships
 * Shows why customers appear without payments/payment methods
 */

import PaymentProcessorTool from "../services/mcp-tools/paymentProcessorTool.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testStripeBasics() {
  console.log("🧪 Testing Stripe Basics - Customer-Payment Relationships\n");

  const paymentTool = new PaymentProcessorTool();
  let customerId = null;

  // Step 1: Create a customer
  console.log("1️⃣ Creating Customer...");
  try {
    const customerResult = await paymentTool.execute("create customer", {
      email: "basics-test@example.com",
      name: "Basics Test Customer",
      description: "Customer for basic relationship testing",
    });

    if (customerResult.success) {
      customerId = customerResult.result.customer.id;
      console.log("✅ Customer Created:");
      console.log(`   ID: ${customerId}`);
      console.log(`   Email: ${customerResult.result.customer.email}`);
    }
    console.log("\n");
  } catch (error) {
    console.log("❌ Customer Creation Failed:", error.message);
    return;
  }

  // Step 2: Create a payment intent for the customer
  console.log("2️⃣ Creating Payment Intent for Customer...");
  try {
    const paymentIntentResult = await paymentTool.execute("create payment", {
      amount: 3000, // $30.00 in cents
      currency: "usd",
      customer_id: customerId,
      description: "Test payment linked to customer",
      metadata: {
        customer_id: customerId,
        test_type: "basic_relationship",
      },
    });

    if (paymentIntentResult.success) {
      console.log("✅ Payment Intent Created:");
      console.log(`   ID: ${paymentIntentResult.result.payment_intent.id}`);
      console.log(
        `   Amount: $${(
          paymentIntentResult.result.payment_intent.amount / 100
        ).toFixed(2)}`
      );
      console.log(
        `   Status: ${paymentIntentResult.result.payment_intent.status}`
      );
      console.log(`   Customer: ${customerId}`);
    }
    console.log("\n");
  } catch (error) {
    console.log("❌ Payment Intent Creation Failed:", error.message);
    console.log("\n");
  }

  // Step 3: List customer's payment intents
  console.log("3️⃣ Listing Customer's Payment Intents...");
  try {
    const paymentIntentsResult = await paymentTool.execute(
      "list payment intents",
      {
        customer_id: customerId,
      }
    );

    if (paymentIntentsResult.success) {
      console.log("✅ Customer Payment Intents:");
      console.log(
        `   Found: ${paymentIntentsResult.result.payment_intents.length} payment intent(s)`
      );
      paymentIntentsResult.result.payment_intents.forEach((pi, index) => {
        console.log(`   ${index + 1}. ID: ${pi.id}`);
        console.log(
          `      Amount: $${(pi.amount / 100).toFixed(
            2
          )} ${pi.currency.toUpperCase()}`
        );
        console.log(`      Status: ${pi.status}`);
        console.log(`      Description: ${pi.description || "N/A"}`);
      });
    }
    console.log("\n");
  } catch (error) {
    console.log("❌ Payment Intents List Failed:", error.message);
    console.log("\n");
  }

  // Step 4: List all customers
  console.log("4️⃣ Listing All Customers...");
  try {
    const customersResult = await paymentTool.execute("list customers", {
      limit: 10,
    });

    if (customersResult.success) {
      console.log("✅ All Customers:");
      console.log(
        `   Found: ${customersResult.result.customers.length} customer(s)`
      );
      customersResult.result.customers.forEach((customer, index) => {
        console.log(`   ${index + 1}. ID: ${customer.id}`);
        console.log(`      Email: ${customer.email || "N/A"}`);
        console.log(`      Name: ${customer.name || "N/A"}`);
        console.log(`      Description: ${customer.description || "N/A"}`);
      });
    }
    console.log("\n");
  } catch (error) {
    console.log("❌ Customers List Failed:", error.message);
    console.log("\n");
  }

  console.log("🎉 Basic Stripe Test Completed!");
  console.log("\n💡 Key Points:");
  console.log("   ✅ Customers can be created independently");
  console.log("   ✅ Payment intents can be linked to customers");
  console.log(
    "   ✅ Payment methods require frontend integration (Stripe Elements)"
  );
  console.log(
    "   ✅ In test mode, you can see the relationships in Stripe Dashboard"
  );
  console.log("\n🔗 Check your Stripe Dashboard at:");
  console.log("   https://dashboard.stripe.com/test/customers");
  console.log("   https://dashboard.stripe.com/test/payments");
}

// Run the basic test
testStripeBasics().catch((error) => {
  console.error("❌ Basic test failed:", error);
  process.exit(1);
});
