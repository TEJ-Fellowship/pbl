/**
 * Artillery processor functions for load testing
 */

module.exports = {
  /**
   * Generate random seat IDs for booking
   * Returns array of 1-3 random seats
   */
  generateSeatIds: () => {
    const numSeats = Math.floor(Math.random() * 3) + 1; // 1-3 seats
    const seatIds = [];
    const usedSeats = new Set();

    for (let i = 0; i < numSeats; i++) {
      let seatNum;
      do {
        seatNum = Math.floor(Math.random() * 1000) + 1; // 1-1000
      } while (usedSeats.has(seatNum));

      usedSeats.add(seatNum);
      seatIds.push(`seat${seatNum}`);
    }

    return seatIds;
  },

  /**
   * Custom function to generate and set seat IDs
   * Called explicitly in the flow
   */
  generateSeatsForRequest: (context, events, done) => {
    // Initialize context.vars if it doesn't exist
    if (!context.vars) {
      context.vars = {};
    }
    // Generate seat IDs and set as variable for use in templates
    const seatIds = module.exports.generateSeatIds();
    context.vars.seatIds = seatIds;
    return done();
  },
};
