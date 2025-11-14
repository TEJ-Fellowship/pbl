const User = require("./User");
const Theater = require("./Theater");
const Screen = require("./Screen");
const Movie = require("./Movie");
const Showtime = require("./Showtime");
const Seat = require("./Seat");
const SeatReservation = require("./SeatReservation");
const Booking = require("./Booking");
const BookingSeat = require("./BookingSeat");

// ============================================
// Define Relationships
// ============================================

// Theater -> Screen (One-to-Many)
Theater.hasMany(Screen, {
  foreignKey: "theater_id",
  as: "screens",
  onDelete: "CASCADE",
});
Screen.belongsTo(Theater, {
  foreignKey: "theater_id",
  as: "theater",
});

// Screen -> Seat (One-to-Many)
Screen.hasMany(Seat, {
  foreignKey: "screen_id",
  as: "seats",
  onDelete: "CASCADE",
});
Seat.belongsTo(Screen, {
  foreignKey: "screen_id",
  as: "screen",
});

// Screen -> Showtime (One-to-Many)
Screen.hasMany(Showtime, {
  foreignKey: "screen_id",
  as: "showtimes",
  onDelete: "CASCADE",
});
Showtime.belongsTo(Screen, {
  foreignKey: "screen_id",
  as: "screen",
});

// Movie -> Showtime (One-to-Many)
Movie.hasMany(Showtime, {
  foreignKey: "movie_id",
  as: "showtimes",
  onDelete: "CASCADE",
});
Showtime.belongsTo(Movie, {
  foreignKey: "movie_id",
  as: "movie",
});

// User -> Booking (One-to-Many)
User.hasMany(Booking, {
  foreignKey: "user_id",
  as: "bookings",
  onDelete: "CASCADE",
});
Booking.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// Showtime -> Booking (One-to-Many)
Showtime.hasMany(Booking, {
  foreignKey: "showtime_id",
  as: "bookings",
  onDelete: "CASCADE",
});
Booking.belongsTo(Showtime, {
  foreignKey: "showtime_id",
  as: "showtime",
});

// Booking -> BookingSeat (One-to-Many)
Booking.hasMany(BookingSeat, {
  foreignKey: "booking_id",
  as: "bookingSeats",
  onDelete: "CASCADE",
});
BookingSeat.belongsTo(Booking, {
  foreignKey: "booking_id",
  as: "booking",
});

// Seat -> BookingSeat (One-to-Many)
Seat.hasMany(BookingSeat, {
  foreignKey: "seat_id",
  as: "bookingSeats",
  onDelete: "CASCADE",
});
BookingSeat.belongsTo(Seat, {
  foreignKey: "seat_id",
  as: "seat",
});

// Showtime -> BookingSeat (One-to-Many)
Showtime.hasMany(BookingSeat, {
  foreignKey: "showtime_id",
  as: "bookingSeats",
  onDelete: "CASCADE",
});
BookingSeat.belongsTo(Showtime, {
  foreignKey: "showtime_id",
  as: "showtime",
});

// Showtime -> SeatReservation (One-to-Many)
Showtime.hasMany(SeatReservation, {
  foreignKey: "showtime_id",
  as: "seatReservations",
  onDelete: "CASCADE",
});
SeatReservation.belongsTo(Showtime, {
  foreignKey: "showtime_id",
  as: "showtime",
});

// Seat -> SeatReservation (One-to-Many)
Seat.hasMany(SeatReservation, {
  foreignKey: "seat_id",
  as: "seatReservations",
  onDelete: "CASCADE",
});
SeatReservation.belongsTo(Seat, {
  foreignKey: "seat_id",
  as: "seat",
});

// User -> SeatReservation (One-to-Many)
User.hasMany(SeatReservation, {
  foreignKey: "user_id",
  as: "seatReservations",
  onDelete: "SET NULL",
});
SeatReservation.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

module.exports = {
  User,
  Theater,
  Screen,
  Movie,
  Showtime,
  Seat,
  SeatReservation,
  Booking,
  BookingSeat,
};
