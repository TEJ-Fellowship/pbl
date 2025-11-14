// Application Constants

// Seat Reservation
const RESERVATION_EXPIRY_MINUTES = 5;
const RESERVATION_EXPIRY_MS = RESERVATION_EXPIRY_MINUTES * 60 * 1000;

// Seat Pricing Multipliers
const SEAT_PRICE_MULTIPLIERS = {
  regular: 1.0,
  premium: 1.5,
  vip: 2.0,
};

// Request Limits
const REQUEST_BODY_SIZE_LIMIT = "10mb";

// Payment Simulation
const PAYMENT_SUCCESS_RATE = 0.9; // 90% success rate

module.exports = {
  RESERVATION_EXPIRY_MINUTES,
  RESERVATION_EXPIRY_MS,
  SEAT_PRICE_MULTIPLIERS,
  REQUEST_BODY_SIZE_LIMIT,
  PAYMENT_SUCCESS_RATE,
};
