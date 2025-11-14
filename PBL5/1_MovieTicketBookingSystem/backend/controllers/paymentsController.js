const { Booking } = require("../models");

// Simulated payment processing
const processPayment = async (req, res, next) => {
  try {
    const { booking_id, payment_method, amount } = req.body;

    // Verify booking exists and amount matches
    const booking = await Booking.findByPk(booking_id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (parseFloat(amount) !== parseFloat(booking.total_amount)) {
      return res
        .status(400)
        .json({ error: "Payment amount does not match booking total" });
    }

    // Simulate payment processing (in real app, integrate with payment gateway)
    const paymentStatus = Math.random() > 0.1 ? "success" : "failed"; // 90% success rate

    if (paymentStatus === "success") {
      // Update booking status to confirmed
      await booking.update({
        status: "confirmed",
        confirmed_at: new Date(),
      });

      // Create payment record (if you have a payments table)
      // For now, we'll just return success
      res.json({
        payment_id: `pay_${Date.now()}`,
        booking_id,
        amount,
        status: "success",
        payment_method,
        transaction_id: `txn_${Date.now()}`,
        message: "Payment processed successfully",
      });
    } else {
      res.status(402).json({
        payment_id: `pay_${Date.now()}`,
        booking_id,
        amount,
        status: "failed",
        payment_method,
        message: "Payment processing failed. Please try again.",
      });
    }
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // In a real implementation, you would query a payments table
    // For now, return a placeholder response
    res.json({
      message:
        "Payment retrieval not fully implemented. Payment records would be stored here.",
      payment_id: id,
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    // In a real implementation, you would query a payments table
    // For now, return booking info as payment reference
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({
      message:
        "Payment retrieval not fully implemented. Payment records would be stored here.",
      booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processPayment,
  getPaymentById,
  getPaymentByBooking,
};
