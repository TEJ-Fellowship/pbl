const { faker } = require("@faker-js/faker");
const pool = require("../src/config/database"); // Adjust path based on your structure

// Configuration
const NUM_USERS = 100;
const NUM_THEATERS = 20;
const NUM_MOVIES = 50;
const SCREENS_PER_THEATER = 3; // Average screens per theater
const SEATS_PER_SCREEN = 50; // Average seats per screen
const SHOWTIMES_PER_MOVIE = 5; // Average showtimes per movie

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
    const user = {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
    };

    const result = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
      [user.name, user.email]
    );

    users.push(result.rows[0].id);
  }

  console.log(`✅ Created ${users.length} users`);
  return users;
}

// Seed Theaters
async function seedTheaters() {
  console.log("Seeding theaters...");
  const theaters = [];
  const cities = [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
  ];

  for (let i = 0; i < NUM_THEATERS; i++) {
    const theater = {
      name: faker.company.name() + " Theater",
      location: faker.location.streetAddress(),
      city: faker.helpers.arrayElement(cities),
    };

    const result = await pool.query(
      "INSERT INTO theaters (name, location, city) VALUES ($1, $2, $3) RETURNING id",
      [theater.name, theater.location, theater.city]
    );

    theaters.push(result.rows[0].id);
  }

  console.log(`✅ Created ${theaters.length} theaters`);
  return theaters;
}

// Seed Screens
async function seedScreens(theaterIds) {
  console.log("Seeding screens...");
  const screens = [];

  for (const theaterId of theaterIds) {
    const numScreens = faker.number.int({ min: 2, max: 5 });

    for (let screenNum = 1; screenNum <= numScreens; screenNum++) {
      const totalSeats = faker.number.int({ min: 40, max: 100 });

      // Generate seat layout (rows and columns)
      const rows = Math.ceil(Math.sqrt(totalSeats));
      const columns = Math.ceil(totalSeats / rows);
      const seatLayout = {
        rows: rows,
        columns: columns,
        total_seats: totalSeats,
      };

      const result = await pool.query(
        "INSERT INTO screens (theater_id, screen_number, total_seats, seat_layout) VALUES ($1, $2, $3, $4) RETURNING id",
        [theaterId, screenNum, totalSeats, JSON.stringify(seatLayout)]
      );

      screens.push({
        id: result.rows[0].id,
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
    const rows = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
    ];
    const seatTypes = ["regular", "premium", "vip"];

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

        await pool.query(
          "INSERT INTO seats (screen_id, seat_number, row_number, column_number, seat_type) VALUES ($1, $2, $3, $4, $5)",
          [screen.id, seatNumber, rowLetter, colIndex, seatType]
        );

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
    "Fantasy",
    "Animation",
  ];
  const languages = [
    "English",
    "Hindi",
    "Spanish",
    "French",
    "Japanese",
    "Korean",
  ];
  const ratings = ["G", "PG", "PG-13", "R", "NC-17"];

  for (let i = 0; i < NUM_MOVIES; i++) {
    const movie = {
      title: faker.music.songName() + " " + faker.word.noun(), // Creative movie titles
      description: faker.lorem.paragraph(),
      duration: faker.number.int({ min: 90, max: 180 }), // 90-180 minutes
      genre: faker.helpers.arrayElement(genres),
      language: faker.helpers.arrayElement(languages),
      rating: faker.helpers.arrayElement(ratings),
      poster_url: faker.image.url({ width: 300, height: 450 }),
      release_date: getPastDate(365), // Released in past year
    };

    const result = await pool.query(
      "INSERT INTO movies (title, description, duration, genre, language, rating, poster_url, release_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [
        movie.title,
        movie.description,
        movie.duration,
        movie.genre,
        movie.language,
        movie.rating,
        movie.poster_url,
        movie.release_date,
      ]
    );

    movies.push(result.rows[0].id);
  }

  console.log(`✅ Created ${movies.length} movies`);
  return movies;
}

// Seed Showtimes
async function seedShowtimes(movieIds, screens) {
  console.log("Seeding showtimes...");
  let totalShowtimes = 0;

  for (const movieId of movieIds) {
    const numShowtimes = faker.number.int({ min: 3, max: 8 });

    for (let i = 0; i < numShowtimes; i++) {
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

      const result = await pool.query(
        "INSERT INTO showtimes (movie_id, screen_id, show_time, price, available_seats, total_seats, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [
          movieId,
          screen.id,
          showTime,
          price,
          screen.total_seats,
          screen.total_seats,
          "active",
        ]
      );

      totalShowtimes++;
    }
  }

  console.log(`✅ Created ${totalShowtimes} showtimes`);
}

// Seed Bookings (optional - for testing)
async function seedBookings(userIds, showtimeIds) {
  console.log("Seeding bookings...");
  const NUM_BOOKINGS = 200;

  for (let i = 0; i < NUM_BOOKINGS; i++) {
    const userId = faker.helpers.arrayElement(userIds);
    const showtimeId = faker.helpers.arrayElement(showtimeIds);

    // Get showtime details
    const showtimeResult = await pool.query(
      "SELECT price, available_seats FROM showtimes WHERE id = $1",
      [showtimeId]
    );

    if (
      showtimeResult.rows.length === 0 ||
      showtimeResult.rows[0].available_seats <= 0
    ) {
      continue; // Skip if no seats available
    }

    const showtime = showtimeResult.rows[0];
    const numSeats = faker.number.int({ min: 1, max: 4 });
    const totalAmount = parseFloat(showtime.price) * numSeats;

    // Create booking
    const bookingResult = await pool.query(
      "INSERT INTO bookings (user_id, showtime_id, status, total_amount, confirmed_at) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [userId, showtimeId, "confirmed", totalAmount, new Date()]
    );

    const bookingId = bookingResult.rows[0].id;

    // Get available seats for this showtime
    const seatsResult = await pool.query(
      `SELECT s.id FROM seats s
       JOIN screens sc ON s.screen_id = sc.id
       JOIN showtimes st ON sc.id = st.screen_id
       WHERE st.id = $1
       AND s.id NOT IN (
         SELECT seat_id FROM booking_seats WHERE showtime_id = $1
       )
       LIMIT $2`,
      [showtimeId, numSeats]
    );

    // Create booking_seats entries
    for (const seat of seatsResult.rows) {
      await pool.query(
        "INSERT INTO booking_seats (booking_id, seat_id, showtime_id, price) VALUES ($1, $2, $3, $4)",
        [bookingId, seat.id, showtimeId, showtime.price]
      );
    }
  }

  console.log(`✅ Created ${NUM_BOOKINGS} bookings`);
}

// Main seed function
async function seed() {
  try {
    console.log("🌱 Starting database seeding...\n");

    // Seed in order (respecting foreign key constraints)
    const userIds = await seedUsers();
    const theaterIds = await seedTheaters();
    const screens = await seedScreens(theaterIds);
    await seedSeats(screens);
    const movieIds = await seedMovies();
    await seedShowtimes(movieIds, screens);

    // Optional: Seed bookings (uncomment if needed)
    // const showtimeIds = await pool.query('SELECT id FROM showtimes');
    // await seedBookings(userIds, showtimeIds.rows.map(r => r.id));

    console.log("\n✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seed
if (require.main === module) {
  seed();
}

module.exports = { seed };
