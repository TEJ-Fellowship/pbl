/**
 * Debug script to check payment method creation response structure
 */

import PaymentProcessorTool from "../services/mcp-tools/paymentProcessorTool.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function debugPaymentMethod() {
  console.log("🔍 Debugging Payment Method Creation\n");

  const paymentTool = new PaymentProcessorTool();

  try {
    const result = await paymentTool.execute("create payment method", {
      type: "card",
      card: {
        number: "4242424242424242",
        exp_month: 12,
        exp_year: 2025,
        cvc: "123",
      },
      billing_details: {
        name: "Debug Test",
        email: "debug@example.com",
      },
    });

    console.log("🔍 Full Response Structure:");
    console.log(JSON.stringify(result, null, 2));

    console.log("\n🔍 Checking result.result:");
    console.log(result.result);

    if (result.result && result.result.payment_method) {
      console.log("\n✅ Payment Method Found:");
      console.log("ID:", result.result.payment_method.id);
    } else {
      console.log("\n❌ Payment Method Not Found in Expected Location");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

debugPaymentMethod();
