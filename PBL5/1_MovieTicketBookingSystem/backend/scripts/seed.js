const { faker } = require("@faker-js/faker");
const { connectToDatabase, sequelize } = require("../utils/db");
const { User, Theater, Screen, Movie, Showtime, Seat } = require("../models");

// ============================================
// REDUCED DATA FOR TESTING (Smaller storage)
// ============================================
const NUM_USERS = 10; // Reduced from 100
const NUM_THEATERS = 3; // Reduced from 20
const NUM_MOVIES = 10; // Reduced from 50
const SCREENS_PER_THEATER = 2; // Reduced from 3-5
const SEATS_PER_SCREEN = 30; // Reduced from 40-100
const SHOWTIMES_PER_MOVIE = 3; // Reduced from 5-8

// Helper function to generate random date in future
function getFutureDate(daysFromNow = 30) {
  const date = new Date();
  date.setDate(date.getDate() + faker.number.int({ min: 1, max: daysFromNow }));
  return date;
}

// Helper function to generate random date in past
function getPastDate(daysAgo = 180) {
  const date = new Date();
  date.setDate(date.getDate() - faker.number.int({ min: 1, max: daysAgo }));
  return date;
}

// Seed Users
async function seedUsers() {
  console.log("Seeding users...");
  const users = [];

  for (let i = 0; i < NUM_USERS; i++) {
    const user = await User.create({
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
    });
    users.push(user.id);
  }

  console.log(`✅ Created ${users.length} users`);
  return users;
}

// Seed Theaters
async function seedTheaters() {
  console.log("Seeding theaters...");
  const theaters = [];
  const cities = ["New York", "Los Angeles", "Chicago"];

  for (let i = 0; i < NUM_THEATERS; i++) {
    const theater = await Theater.create({
      name: faker.company.name() + " Theater",
      location: faker.location.streetAddress(),
      city: faker.helpers.arrayElement(cities),
    });
    theaters.push(theater.id);
  }

  console.log(`✅ Created ${theaters.length} theaters`);
  return theaters;
}

// Seed Screens
async function seedScreens(theaterIds) {
  console.log("Seeding screens...");
  const screens = [];

  for (const theaterId of theaterIds) {
    for (let screenNum = 1; screenNum <= SCREENS_PER_THEATER; screenNum++) {
      const totalSeats = SEATS_PER_SCREEN;

      // Generate seat layout (rows and columns)
      const rows = Math.ceil(Math.sqrt(totalSeats));
      const columns = Math.ceil(totalSeats / rows);
      const seatLayout = {
        rows: rows,
        columns: columns,
        total_seats: totalSeats,
      };

      const screen = await Screen.create({
        theater_id: theaterId,
        screen_number: screenNum,
        total_seats: totalSeats,
        seat_layout: seatLayout,
      });

      screens.push({
        id: screen.id,
        theater_id: theaterId,
        total_seats: totalSeats,
      });
    }
  }

  console.log(`✅ Created ${screens.length} screens`);
  return screens;
}

// Seed Seats
async function seedSeats(screens) {
  console.log("Seeding seats...");
  let totalSeats = 0;

  for (const screen of screens) {
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

    // Calculate rows and columns based on total_seats
    const numRows = Math.ceil(Math.sqrt(screen.total_seats));
    const seatsPerRow = Math.ceil(screen.total_seats / numRows);

    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      const rowLetter = rows[rowIndex % rows.length];

      for (
        let colIndex = 1;
        colIndex <= seatsPerRow &&
        rowIndex * seatsPerRow + colIndex <= screen.total_seats;
        colIndex++
      ) {
        // Determine seat type (more regular seats, fewer VIP)
        let seatType = "regular";
        const rand = Math.random();
        if (rand < 0.1) seatType = "vip";
        else if (rand < 0.3) seatType = "premium";

        const seatNumber = `${rowLetter}${colIndex}`;

        await Seat.create({
          screen_id: screen.id,
          seat_number: seatNumber,
          row_number: rowLetter,
          column_number: colIndex,
          seat_type: seatType,
        });

        totalSeats++;
      }
    }
  }

  console.log(`✅ Created ${totalSeats} seats`);
}

// Seed Movies
async function seedMovies() {
  console.log("Seeding movies...");
  const movies = [];
  const genres = [
    "Action",
    "Comedy",
    "Drama",
    "Horror",
    "Sci-Fi",
    "Thriller",
    "Romance",
    "Adventure",
  ];
  const languages = ["English", "Hindi", "Spanish", "French"];
  const ratings = ["G", "PG", "PG-13", "R"];

  for (let i = 0; i < NUM_MOVIES; i++) {
    const movie = await Movie.create({
      title: faker.music.songName() + " " + faker.word.noun(),
      description: faker.lorem.paragraph(),
      duration: faker.number.int({ min: 90, max: 180 }),
      genre: faker.helpers.arrayElement(genres),
      language: faker.helpers.arrayElement(languages),
      rating: faker.helpers.arrayElement(ratings),
      poster_url: faker.image.url({ width: 300, height: 450 }),
      release_date: getPastDate(365),
    });

    movies.push(movie.id);
  }

  console.log(`✅ Created ${movies.length} movies`);
  return movies;
}

// Seed Showtimes
async function seedShowtimes(movieIds, screens) {
  console.log("Seeding showtimes...");
  let totalShowtimes = 0;

  for (const movieId of movieIds) {
    // Get movie to access duration
    const movie = await Movie.findByPk(movieId);

    for (let i = 0; i < SHOWTIMES_PER_MOVIE; i++) {
      // Pick a random screen
      const screen = faker.helpers.arrayElement(screens);

      // Generate showtime in the future (next 30 days)
      const showTime = getFutureDate(30);
      // Set random time (between 10 AM and 11 PM)
      showTime.setHours(faker.number.int({ min: 10, max: 23 }));
      showTime.setMinutes(faker.helpers.arrayElement([0, 15, 30, 45]));

      const price = parseFloat(
        faker.commerce.price({ min: 8, max: 25, dec: 2 })
      );

      await Showtime.create({
        movie_id: movieId,
        screen_id: screen.id,
        show_time: showTime,
        price: price,
        available_seats: screen.total_seats,
        total_seats: screen.total_seats,
        status: "active",
      });

      totalShowtimes++;
    }
  }

  console.log(`✅ Created ${totalShowtimes} showtimes`);
}

// Main seed function
async function seed() {
  try {
    console.log("🌱 Starting database seeding...\n");

    // Connect to database
    await connectToDatabase();

    // Seed in order (respecting foreign key constraints)
    const userIds = await seedUsers();
    const theaterIds = await seedTheaters();
    const screens = await seedScreens(theaterIds);
    await seedSeats(screens);
    const movieIds = await seedMovies();
    await seedShowtimes(movieIds, screens);

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Users: ${NUM_USERS}`);
    console.log(`   - Theaters: ${NUM_THEATERS}`);
    console.log(`   - Screens: ${NUM_THEATERS * SCREENS_PER_THEATER}`);
    console.log(
      `   - Seats: ~${NUM_THEATERS * SCREENS_PER_THEATER * SEATS_PER_SCREEN}`
    );
    console.log(`   - Movies: ${NUM_MOVIES}`);
    console.log(`   - Showtimes: ~${NUM_MOVIES * SHOWTIMES_PER_MOVIE}`);
    console.log("\n💾 Estimated storage: < 1MB (very small for testing)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run seed
if (require.main === module) {
  seed();
}

module.exports = { seed };
