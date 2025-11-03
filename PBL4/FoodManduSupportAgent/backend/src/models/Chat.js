import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    language: { type: String, default: "en" },
    sessionId: { type: String, index: true }, // For conversational context
    // Analytics fields
    intent: { type: String }, // track_order, payment_issue, refund_request, etc.
    mcpTool: { type: String }, // get_all_details, get_order_status, etc.
    orderId: { type: String, index: true }, // for order-related queries
    latencyMs: { type: Number }, // processing time in milliseconds
    method: {
      type: String,
      enum: ["RAG", "MCP", "HYBRID"],
      default: "RAG",
    },
    userLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    topic: { type: String }, // payment, delivery, restaurant, etc.
    wasEscalated: { type: Boolean, default: false },
    ticketId: { type: String }, // if escalated to support ticket
  },
  { timestamps: true }
);

// Index for analytics queries
chatSchema.index({ createdAt: -1 });
chatSchema.index({ intent: 1 });
chatSchema.index({ mcpTool: 1 });

export default mongoose.model("Chat", chatSchema);
