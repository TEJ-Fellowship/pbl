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
  /**
   * Generate seat sets that intentionally overlap for atomicity testing
   * Multiple users will try to book the same seats simultaneously
   */
  generateAtomicitySeatSets: (context, events, done) => {
    if (!context.vars) {
      context.vars = {};
    }

    // Focus on a small set of "hot" seats that many users will compete for
    // This creates intentional collisions to test atomicity
    const hotSeats = [
      "seat1",
      "seat2",
      "seat3",
      "seat4",
      "seat5",
      "seat6",
      "seat7",
      "seat8",
    ];

    // Generate 2-4 seats from the hot seat pool
    const numSeats = Math.floor(Math.random() * 3) + 2; // 2-4 seats
    const selectedSeats = [];
    const used = new Set();

    for (let i = 0; i < numSeats; i++) {
      let seat;
      do {
        seat = hotSeats[Math.floor(Math.random() * hotSeats.length)];
      } while (used.has(seat));
      used.add(seat);
      selectedSeats.push(seat);
    }

    context.vars.atomicSeatIds = selectedSeats;
    return done();
  },
};
