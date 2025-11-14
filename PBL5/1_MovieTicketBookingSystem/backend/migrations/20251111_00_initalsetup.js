const { Sequelize } = require("sequelize");

module.exports = {
  up: async ({ context: queryInterface }) => {
    // Enable UUID extension
    await queryInterface.sequelize.query(
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    );

    // Users table
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Theaters table
    await queryInterface.createTable("theaters", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      total_screens: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Screens table
    await queryInterface.createTable("screens", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
      },
      theater_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "theaters",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      screen_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total_seats: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      seat_layout: {
        type: Sequelize.JSONB,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add unique constraint for screens
    await queryInterface.addConstraint("screens", {
      fields: ["theater_id", "screen_number"],
      type: "unique",
      name: "screens_theater_screen_unique",
    });

    // Movies table
    await queryInterface.createTable("movies", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      genre: {
        type: Sequelize.STRING(100),
      },
      language: {
        type: Sequelize.STRING(50),
      },
      rating: {
        type: Sequelize.STRING(10),
      },
      poster_url: {
        type: Sequelize.STRING(500),
      },
      release_date: {
        type: Sequelize.DATEONLY,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Showtimes table
    await queryInterface.createTable("showtimes", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
      },
      movie_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "movies",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      screen_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "screens",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      show_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      available_seats: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total_seats: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("active", "cancelled", "completed"),
        defaultValue: "active",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add check constraint for showtimes price
    await queryInterface.sequelize.query(`
      ALTER TABLE showtimes ADD CONSTRAINT showtimes_price_check 
      CHECK (price >= 0);
    `);

    // Seats table
    await queryInterface.createTable("seats", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
      },
      screen_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "screens",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      seat_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      row_number: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      column_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      seat_type: {
        type: Sequelize.ENUM("regular", "premium", "vip"),
        defaultValue: "regular",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add unique constraint for seats
    await queryInterface.addConstraint("seats", {
      fields: ["screen_id", "seat_number"],
      type: "unique",
      name: "seats_screen_seat_unique",
    });

    // Seat reservations table
    await queryInterface.createTable("seat_reservations", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
      },
      showtime_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "showtimes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      seat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "seats",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.UUID,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      status: {
        type: Sequelize.ENUM("reserved", "expired", "confirmed"),
        defaultValue: "reserved",
      },
      reserved_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add unique constraint for seat_reservations
    await queryInterface.addConstraint("seat_reservations", {
      fields: ["showtime_id", "seat_id", "status"],
      type: "unique",
      name: "seat_reservations_unique",
    });

    // Bookings table
    await queryInterface.createTable("bookings", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      showtime_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "showtimes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "reserved",
          "confirmed",
          "cancelled",
          "expired"
        ),
        defaultValue: "pending",
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      confirmed_at: {
        type: Sequelize.DATE,
      },
    });

    // Add check constraint for bookings total_amount
    await queryInterface.sequelize.query(`
      ALTER TABLE bookings ADD CONSTRAINT bookings_total_amount_check 
      CHECK (total_amount >= 0);
    `);

    // Booking seats junction table
    await queryInterface.createTable("booking_seats", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
      },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "bookings",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      seat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "seats",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      showtime_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "showtimes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add unique constraint for booking_seats
    await queryInterface.addConstraint("booking_seats", {
      fields: ["booking_id", "seat_id", "showtime_id"],
      type: "unique",
      name: "booking_seats_unique",
    });

    // Add check constraint for booking_seats price
    await queryInterface.sequelize.query(`
      ALTER TABLE booking_seats ADD CONSTRAINT booking_seats_price_check 
      CHECK (price >= 0);
    `);

    // ============================================
    // INDEXES FOR PERFORMANCE
    // ============================================

    await queryInterface.addIndex("users", ["email"], {
      name: "idx_users_email",
    });
    // Theaters indexes
    await queryInterface.addIndex("theaters", ["city"], {
      name: "idx_theaters_city",
    });
    await queryInterface.addIndex("theaters", ["location"], {
      name: "idx_theaters_location",
    });

    // Screens indexes
    await queryInterface.addIndex("screens", ["theater_id"], {
      name: "idx_screens_theater_id",
    });

    // Movies indexes
    await queryInterface.addIndex("movies", ["genre"], {
      name: "idx_movies_genre",
    });
    await queryInterface.addIndex("movies", ["title"], {
      name: "idx_movies_title",
    });
    await queryInterface.addIndex("movies", ["release_date"], {
      name: "idx_movies_release_date",
    });

    // Showtimes indexes (critical for performance)
    await queryInterface.addIndex("showtimes", ["movie_id"], {
      name: "idx_showtimes_movie_id",
    });
    await queryInterface.addIndex("showtimes", ["screen_id"], {
      name: "idx_showtimes_screen_id",
    });
    await queryInterface.addIndex("showtimes", ["show_time"], {
      name: "idx_showtimes_show_time",
    });
    await queryInterface.addIndex("showtimes", ["status"], {
      name: "idx_showtimes_status",
    });
    await queryInterface.addIndex("showtimes", ["movie_id", "show_time"], {
      name: "idx_showtimes_movie_time",
    });

    // Seats indexes
    await queryInterface.addIndex("seats", ["screen_id"], {
      name: "idx_seats_screen_id",
    });
    await queryInterface.addIndex("seats", ["seat_type"], {
      name: "idx_seats_seat_type",
    });

    // Seat reservations indexes (critical for concurrency)
    await queryInterface.addIndex("seat_reservations", ["showtime_id"], {
      name: "idx_seat_reservations_showtime_id",
    });
    await queryInterface.addIndex("seat_reservations", ["seat_id"], {
      name: "idx_seat_reservations_seat_id",
    });
    await queryInterface.addIndex("seat_reservations", ["status"], {
      name: "idx_seat_reservations_status",
    });
    await queryInterface.addIndex("seat_reservations", ["expires_at"], {
      name: "idx_seat_reservations_expires_at",
    });
    await queryInterface.addIndex(
      "seat_reservations",
      ["showtime_id", "seat_id", "status"],
      { name: "idx_seat_reservations_showtime_seat" }
    );

    // Bookings indexes
    await queryInterface.addIndex("bookings", ["user_id"], {
      name: "idx_bookings_user_id",
    });
    await queryInterface.addIndex("bookings", ["showtime_id"], {
      name: "idx_bookings_showtime_id",
    });
    await queryInterface.addIndex("bookings", ["status"], {
      name: "idx_bookings_status",
    });
    await queryInterface.addIndex("bookings", ["created_at"], {
      name: "idx_bookings_created_at",
    });
    // Composite index for user booking history queries
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at DESC);
    `);

    // Booking seats indexes
    await queryInterface.addIndex("booking_seats", ["booking_id"], {
      name: "idx_booking_seats_booking_id",
    });
    await queryInterface.addIndex("booking_seats", ["seat_id"], {
      name: "idx_booking_seats_seat_id",
    });
    await queryInterface.addIndex("booking_seats", ["showtime_id"], {
      name: "idx_booking_seats_showtime_id",
    });
    await queryInterface.addIndex("booking_seats", ["showtime_id", "seat_id"], {
      name: "idx_booking_seats_showtime_seat",
    });

    // ============================================
    // FUNCTIONS AND TRIGGERS
    // ============================================
    // Database-level triggers ensure data integrity and automatic updates
    // without requiring application-level logic

    // Function to automatically update updated_at timestamp on row updates
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Apply updated_at triggers
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_theaters_updated_at BEFORE UPDATE ON theaters
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_screens_updated_at BEFORE UPDATE ON screens
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_showtimes_updated_at BEFORE UPDATE ON showtimes
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Function to automatically update showtime available_seats count
    // Maintains seat availability in real-time as bookings are created/deleted
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_showtime_available_seats()
      RETURNS TRIGGER AS $$
      BEGIN
          IF TG_OP = 'INSERT' THEN
              UPDATE showtimes
              SET available_seats = available_seats - 1
              WHERE id = NEW.showtime_id;
              RETURN NEW;
          ELSIF TG_OP = 'DELETE' THEN
              UPDATE showtimes
              SET available_seats = available_seats + 1
              WHERE id = OLD.showtime_id;
              RETURN OLD;
          END IF;
          RETURN NULL;
      END;
      $$ language 'plpgsql';
    `);

    // Trigger to update available_seats when booking_seats changes
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_showtime_seats_on_booking
          AFTER INSERT OR DELETE ON booking_seats
          FOR EACH ROW EXECUTE FUNCTION update_showtime_available_seats();
    `);

    // Function to automatically update theater total_screens count
    // Maintains denormalized screen count for performance
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_theater_screen_count()
      RETURNS TRIGGER AS $$
      BEGIN
          IF TG_OP = 'INSERT' THEN
              UPDATE theaters
              SET total_screens = total_screens + 1
              WHERE id = NEW.theater_id;
              RETURN NEW;
          ELSIF TG_OP = 'DELETE' THEN
              UPDATE theaters
              SET total_screens = total_screens - 1
              WHERE id = OLD.theater_id;
              RETURN OLD;
          END IF;
          RETURN NULL;
      END;
      $$ language 'plpgsql';
    `);

    // Trigger to update theater screen count
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_theater_screen_count_trigger
          AFTER INSERT OR DELETE ON screens
          FOR EACH ROW EXECUTE FUNCTION update_theater_screen_count();
    `);
  },

  down: async ({ context: queryInterface }) => {
    // ============================================
    // ROLLBACK: Drop in reverse order
    // ============================================
    // Drop triggers first (before functions)
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_theater_screen_count_trigger ON screens;
      DROP TRIGGER IF EXISTS update_showtime_seats_on_booking ON booking_seats;
      DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
      DROP TRIGGER IF EXISTS update_showtimes_updated_at ON showtimes;
      DROP TRIGGER IF EXISTS update_movies_updated_at ON movies;
      DROP TRIGGER IF EXISTS update_screens_updated_at ON screens;
      DROP TRIGGER IF EXISTS update_theaters_updated_at ON theaters;
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    `);

    // Drop functions (after triggers)
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS update_theater_screen_count();
      DROP FUNCTION IF EXISTS update_showtime_available_seats();
      DROP FUNCTION IF EXISTS update_updated_at_column();
    `);

    // Drop tables in reverse dependency order (respecting foreign key constraints)
    await queryInterface.dropTable("booking_seats");
    await queryInterface.dropTable("bookings");
    await queryInterface.dropTable("seat_reservations");
    await queryInterface.dropTable("seats");
    await queryInterface.dropTable("showtimes");
    await queryInterface.dropTable("movies");
    await queryInterface.dropTable("screens");
    await queryInterface.dropTable("theaters");
    await queryInterface.dropTable("users");
  },
};
