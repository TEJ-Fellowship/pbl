-- Movie Ticket Booking System Database Schema
-- PostgreSQL Database Schema - Tier 1 Core Tables Only

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (simplified, no authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Theaters table
CREATE TABLE theaters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    total_screens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Screens table (screens within theaters)
CREATE TABLE screens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theater_id UUID NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
    screen_number INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    seat_layout JSONB, -- Store seat arrangement (rows, columns, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(theater_id, screen_number)
);

-- Movies table
CREATE TABLE movies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- Duration in minutes
    genre VARCHAR(100),
    language VARCHAR(50),
    rating VARCHAR(10), -- PG, PG-13, R, etc.
    poster_url VARCHAR(500),
    release_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Showtimes table (links movies to screens at specific times)
CREATE TABLE showtimes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
    show_time TIMESTAMP WITH TIME ZONE NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    available_seats INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seats table (seats belong to screens, not showtimes directly)
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
    seat_number VARCHAR(20) NOT NULL, -- e.g., "A1", "B5", "VIP-1"
    row_number VARCHAR(10) NOT NULL,
    column_number INTEGER NOT NULL,
    seat_type VARCHAR(20) DEFAULT 'regular' CHECK (seat_type IN ('regular', 'premium', 'vip')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(screen_id, seat_number)
);

-- Seat reservations table (temporary holds on seats for a showtime)
CREATE TABLE seat_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'reserved' CHECK (status IN ('reserved', 'expired', 'confirmed')),
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 5 minutes from reserved_at
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(showtime_id, seat_id, status) -- Prevent duplicate active reservations
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reserved', 'confirmed', 'cancelled', 'expired')),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Booking seats junction table (many-to-many relationship)
CREATE TABLE booking_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id, seat_id, showtime_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);

-- Theaters indexes
CREATE INDEX idx_theaters_city ON theaters(city);
CREATE INDEX idx_theaters_location ON theaters(location);

-- Screens indexes
CREATE INDEX idx_screens_theater_id ON screens(theater_id);

-- Movies indexes
CREATE INDEX idx_movies_genre ON movies(genre);
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_movies_release_date ON movies(release_date);

-- Showtimes indexes (critical for performance)
CREATE INDEX idx_showtimes_movie_id ON showtimes(movie_id);
CREATE INDEX idx_showtimes_screen_id ON showtimes(screen_id);
CREATE INDEX idx_showtimes_show_time ON showtimes(show_time);
CREATE INDEX idx_showtimes_status ON showtimes(status);
CREATE INDEX idx_showtimes_movie_time ON showtimes(movie_id, show_time);

-- Seats indexes
CREATE INDEX idx_seats_screen_id ON seats(screen_id);
CREATE INDEX idx_seats_seat_type ON seats(seat_type);

-- Seat reservations indexes (critical for concurrency)
CREATE INDEX idx_seat_reservations_showtime_id ON seat_reservations(showtime_id);
CREATE INDEX idx_seat_reservations_seat_id ON seat_reservations(seat_id);
CREATE INDEX idx_seat_reservations_status ON seat_reservations(status);
CREATE INDEX idx_seat_reservations_expires_at ON seat_reservations(expires_at);
CREATE INDEX idx_seat_reservations_showtime_seat ON seat_reservations(showtime_id, seat_id, status);

-- Bookings indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_showtime_id ON bookings(showtime_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at DESC);

-- Booking seats indexes
CREATE INDEX idx_booking_seats_booking_id ON booking_seats(booking_id);
CREATE INDEX idx_booking_seats_seat_id ON booking_seats(seat_id);
CREATE INDEX idx_booking_seats_showtime_id ON booking_seats(showtime_id);
CREATE INDEX idx_booking_seats_showtime_seat ON booking_seats(showtime_id, seat_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theaters_updated_at BEFORE UPDATE ON theaters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screens_updated_at BEFORE UPDATE ON screens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_showtimes_updated_at BEFORE UPDATE ON showtimes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update showtime available_seats
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

-- Trigger to update available_seats when booking_seats changes
CREATE TRIGGER update_showtime_seats_on_booking
    AFTER INSERT OR DELETE ON booking_seats
    FOR EACH ROW EXECUTE FUNCTION update_showtime_available_seats();

-- Function to update theater total_screens count
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

-- Trigger to update theater screen count
CREATE TRIGGER update_theater_screen_count_trigger
    AFTER INSERT OR DELETE ON screens
    FOR EACH ROW EXECUTE FUNCTION update_theater_screen_count();
