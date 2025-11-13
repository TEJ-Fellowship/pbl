import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: false,
      unique: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "delivery_delay",
        "payment_issue",
        "refund_request",
        "order_problem",
        "driver_issue",
        "food_quality",
        "other",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    customerQuestion: {
      type: String,
      required: true,
    },
    aiResponse: {
      type: String,
    },
    urgencyReason: {
      type: String,
    },
    delayMinutes: {
      type: Number,
    },
    language: {
      type: String,
      enum: ["en", "np"],
      default: "en",
    },
    metadata: {
      customerPhone: String,
      restaurantName: String,
      orderTotal: Number,
      paymentMethod: String,
      eta: Number,
      currentStage: Number,
    },
    notes: [
      {
        timestamp: { type: Date, default: Date.now },
        note: String,
        addedBy: String,
      },
    ],
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate ticket ID
ticketSchema.pre("save", async function (next) {
  if (this.isNew && !this.ticketId) {
    const count = await mongoose.model("Ticket").countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
