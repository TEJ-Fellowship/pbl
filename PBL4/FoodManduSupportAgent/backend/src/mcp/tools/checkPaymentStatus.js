/**
 * MCP Tool: Check Payment Gateway Status
 * Checks if eSewa and Khalti payment gateways are operational
 */

export const checkPaymentStatus = {
  name: "check_payment_status",
  description:
    "Check the operational status of payment gateways (eSewa, Khalti) to help diagnose payment issues",
  inputSchema: {
    type: "object",
    properties: {
      gateway: {
        type: "string",
        description:
          "Specific gateway to check (esewa, khalti, all). Default: all",
        enum: ["esewa", "khalti", "all"],
      },
    },
  },
  handler: async ({ gateway = "all" }) => {
    try {
      const statuses = {};

      // Check eSewa status
      if (gateway === "esewa" || gateway === "all") {
        try {
          // Try to ping eSewa's public endpoint (with timeout)
          const esewaController = new AbortController();
          const esewaTimeout = setTimeout(() => esewaController.abort(), 5000);

          const esewaResponse = await fetch("https://esewa.com.np", {
            method: "HEAD",
            signal: esewaController.signal,
          });
          clearTimeout(esewaTimeout);

          statuses.esewa = {
            name: "eSewa",
            operational: esewaResponse.ok,
            status: esewaResponse.ok ? "online" : "issues detected",
            message: esewaResponse.ok
              ? "eSewa is operational"
              : "eSewa may be experiencing issues",
            lastChecked: new Date().toISOString(),
          };
        } catch (error) {
          statuses.esewa = {
            name: "eSewa",
            operational: false,
            status: "unreachable",
            message: "Unable to reach eSewa (may be down or network issue)",
            lastChecked: new Date().toISOString(),
            error: error.message,
          };
        }
      }

      // Check Khalti status
      if (gateway === "khalti" || gateway === "all") {
        try {
          const khaltiController = new AbortController();
          const khaltiTimeout = setTimeout(
            () => khaltiController.abort(),
            5000
          );

          const khaltiResponse = await fetch("https://khalti.com", {
            method: "HEAD",
            signal: khaltiController.signal,
          });
          clearTimeout(khaltiTimeout);

          statuses.khalti = {
            name: "Khalti",
            operational: khaltiResponse.ok,
            status: khaltiResponse.ok ? "online" : "issues detected",
            message: khaltiResponse.ok
              ? "Khalti is operational"
              : "Khalti may be experiencing issues",
            lastChecked: new Date().toISOString(),
          };
        } catch (error) {
          statuses.khalti = {
            name: "Khalti",
            operational: false,
            status: "unreachable",
            message: "Unable to reach Khalti (may be down or network issue)",
            lastChecked: new Date().toISOString(),
            error: error.message,
          };
        }
      }

      // Overall status
      const allOperational = Object.values(statuses).every(
        (s) => s.operational
      );
      const someIssues = Object.values(statuses).some((s) => !s.operational);

      return {
        success: true,
        data: {
          overall: allOperational
            ? "all_systems_operational"
            : someIssues
            ? "some_issues_detected"
            : "unknown",
          gateways: statuses,
          recommendation: allOperational
            ? "All payment gateways are working normally. If you're experiencing payment issues, please check your account balance or contact your bank."
            : "Some payment gateways may be experiencing issues. Please try an alternative payment method (Cash on Delivery) or try again in a few minutes.",
        },
      };
    } catch (error) {
      console.error("❌ Payment status check failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
