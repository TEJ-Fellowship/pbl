# Database Schema Overview

## 📊 All Tables and Their Columns

### 1. **users** Table

**Purpose:** Store user information (customers)

| Column       | Type         | Description           | Constraints      |
| ------------ | ------------ | --------------------- | ---------------- |
| `id`         | UUID         | Primary key           | Auto-generated   |
| `name`       | VARCHAR(255) | User's full name      | NOT NULL         |
| `email`      | VARCHAR(255) | User's email          | UNIQUE, NOT NULL |
| `created_at` | TIMESTAMP    | When user was created | Auto-set         |
| `updated_at` | TIMESTAMP    | Last update time      | Auto-updated     |

**Example Data:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

---

### 2. **theaters** Table

**Purpose:** Store theater/location information

| Column          | Type         | Description       | Constraints               |
| --------------- | ------------ | ----------------- | ------------------------- |
| `id`            | UUID         | Primary key       | Auto-generated            |
| `name`          | VARCHAR(255) | Theater name      | NOT NULL                  |
| `location`      | VARCHAR(255) | Street address    | NOT NULL                  |
| `city`          | VARCHAR(100) | City name         | NOT NULL                  |
| `total_screens` | INTEGER      | Number of screens | Default: 0 (auto-updated) |
| `created_at`    | TIMESTAMP    | Creation time     | Auto-set                  |
| `updated_at`    | TIMESTAMP    | Last update       | Auto-updated              |

**Example Data:**

```json
{
  "id": "223e4567-e89b-12d3-a456-426614174000",
  "name": "AMC Theater",
  "location": "123 Main St",
  "city": "New York",
  "total_screens": 3,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

---

### 3. **screens** Table

**Purpose:** Store screen information within theaters

| Column          | Type      | Description                      | Constraints              |
| --------------- | --------- | -------------------------------- | ------------------------ |
| `id`            | UUID      | Primary key                      | Auto-generated           |
| `theater_id`    | UUID      | Foreign key to theaters          | NOT NULL, CASCADE DELETE |
| `screen_number` | INTEGER   | Screen number (1, 2, 3...)       | NOT NULL                 |
| `total_seats`   | INTEGER   | Total seats in screen            | NOT NULL                 |
| `seat_layout`   | JSONB     | Seat arrangement (rows, columns) | Optional                 |
| `created_at`    | TIMESTAMP | Creation time                    | Auto-set                 |
| `updated_at`    | TIMESTAMP | Last update                      | Auto-updated             |

**Example Data:**

```json
{
  "id": "323e4567-e89b-12d3-a456-426614174000",
  "theater_id": "223e4567-e89b-12d3-a456-426614174000",
  "screen_number": 1,
  "total_seats": 50,
  "seat_layout": { "rows": 5, "columns": 10, "total_seats": 50 },
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

---

### 4. **movies** Table

**Purpose:** Store movie information

| Column         | Type         | Description                     | Constraints    |
| -------------- | ------------ | ------------------------------- | -------------- |
| `id`           | UUID         | Primary key                     | Auto-generated |
| `title`        | VARCHAR(255) | Movie title                     | NOT NULL       |
| `description`  | TEXT         | Movie description               | Optional       |
| `duration`     | INTEGER      | Duration in minutes             | NOT NULL       |
| `genre`        | VARCHAR(100) | Genre (Action, Comedy, etc.)    | Optional       |
| `language`     | VARCHAR(50)  | Language (English, Hindi, etc.) | Optional       |
| `rating`       | VARCHAR(10)  | Rating (PG, PG-13, R, etc.)     | Optional       |
| `poster_url`   | VARCHAR(500) | Poster image URL                | Optional       |
| `release_date` | DATE         | Release date                    | Optional       |
| `created_at`   | TIMESTAMP    | Creation time                   | Auto-set       |
| `updated_at`   | TIMESTAMP    | Last update                     | Auto-updated   |

**Example Data:**

```json
{
  "id": "423e4567-e89b-12d3-a456-426614174000",
  "title": "Inception",
  "description": "A sci-fi thriller...",
  "duration": 148,
  "genre": "Sci-Fi",
  "language": "English",
  "rating": "PG-13",
  "poster_url": "https://example.com/poster.jpg",
  "release_date": "2010-07-16",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

---

### 5. **showtimes** Table

**Purpose:** Link movies to screens at specific times

| Column            | Type          | Description                | Constraints              |
| ----------------- | ------------- | -------------------------- | ------------------------ |
| `id`              | UUID          | Primary key                | Auto-generated           |
| `movie_id`        | UUID          | Foreign key to movies      | NOT NULL, CASCADE DELETE |
| `screen_id`       | UUID          | Foreign key to screens     | NOT NULL, CASCADE DELETE |
| `show_time`       | TIMESTAMP     | When movie shows           | NOT NULL                 |
| `price`           | DECIMAL(10,2) | Ticket price               | NOT NULL, >= 0           |
| `available_seats` | INTEGER       | Available seats            | NOT NULL                 |
| `total_seats`     | INTEGER       | Total seats                | NOT NULL                 |
| `status`          | VARCHAR(20)   | active/cancelled/completed | Default: 'active'        |
| `created_at`      | TIMESTAMP     | Creation time              | Auto-set                 |
| `updated_at`      | TIMESTAMP     | Last update                | Auto-updated             |

**Example Data:**

```json
{
  "id": "523e4567-e89b-12d3-a456-426614174000",
  "movie_id": "423e4567-e89b-12d3-a456-426614174000",
  "screen_id": "323e4567-e89b-12d3-a456-426614174000",
  "show_time": "2024-01-15T18:00:00Z",
  "price": 12.5,
  "available_seats": 45,
  "total_seats": 50,
  "status": "active",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

---

### 6. **seats** Table

**Purpose:** Store individual seat information for screens

| Column          | Type        | Description                    | Constraints              |
| --------------- | ----------- | ------------------------------ | ------------------------ |
| `id`            | UUID        | Primary key                    | Auto-generated           |
| `screen_id`     | UUID        | Foreign key to screens         | NOT NULL, CASCADE DELETE |
| `seat_number`   | VARCHAR(20) | Seat identifier (A1, B5, etc.) | NOT NULL                 |
| `row_number`    | VARCHAR(10) | Row letter (A, B, C...)        | NOT NULL                 |
| `column_number` | INTEGER     | Column number (1, 2, 3...)     | NOT NULL                 |
| `seat_type`     | VARCHAR(20) | regular/premium/vip            | Default: 'regular'       |
| `created_at`    | TIMESTAMP   | Creation time                  | Auto-set                 |

**Example Data:**

```json
{
  "id": "623e4567-e89b-12d3-a456-426614174000",
  "screen_id": "323e4567-e89b-12d3-a456-426614174000",
  "seat_number": "A1",
  "row_number": "A",
  "column_number": 1,
  "seat_type": "regular",
  "created_at": "2024-01-01T10:00:00Z"
}
```

---

### 7. **seat_reservations** Table

**Purpose:** Temporary holds on seats (5-minute reservation)

| Column        | Type        | Description                | Constraints                  |
| ------------- | ----------- | -------------------------- | ---------------------------- |
| `id`          | UUID        | Primary key                | Auto-generated               |
| `showtime_id` | UUID        | Foreign key to showtimes   | NOT NULL, CASCADE DELETE     |
| `seat_id`     | UUID        | Foreign key to seats       | NOT NULL, CASCADE DELETE     |
| `user_id`     | UUID        | Foreign key to users       | Optional, SET NULL on delete |
| `status`      | VARCHAR(20) | reserved/expired/confirmed | Default: 'reserved'          |
| `reserved_at` | TIMESTAMP   | When reserved              | Auto-set                     |
| `expires_at`  | TIMESTAMP   | When reservation expires   | NOT NULL (5 min later)       |
| `created_at`  | TIMESTAMP   | Creation time              | Auto-set                     |

**Example Data:**

```json
{
  "id": "723e4567-e89b-12d3-a456-426614174000",
  "showtime_id": "523e4567-e89b-12d3-a456-426614174000",
  "seat_id": "623e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "reserved",
  "reserved_at": "2024-01-15T17:55:00Z",
  "expires_at": "2024-01-15T18:00:00Z",
  "created_at": "2024-01-15T17:55:00Z"
}
```

---

### 8. **bookings** Table

**Purpose:** Store confirmed ticket bookings

| Column         | Type          | Description                                  | Constraints              |
| -------------- | ------------- | -------------------------------------------- | ------------------------ |
| `id`           | UUID          | Primary key                                  | Auto-generated           |
| `user_id`      | UUID          | Foreign key to users                         | NOT NULL, CASCADE DELETE |
| `showtime_id`  | UUID          | Foreign key to showtimes                     | NOT NULL, CASCADE DELETE |
| `status`       | VARCHAR(20)   | pending/reserved/confirmed/cancelled/expired | Default: 'pending'       |
| `total_amount` | DECIMAL(10,2) | Total booking amount                         | NOT NULL, >= 0           |
| `created_at`   | TIMESTAMP     | Creation time                                | Auto-set                 |
| `updated_at`   | TIMESTAMP     | Last update                                  | Auto-updated             |
| `confirmed_at` | TIMESTAMP     | When booking confirmed                       | Optional                 |

**Example Data:**

```json
{
  "id": "823e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "showtime_id": "523e4567-e89b-12d3-a456-426614174000",
  "status": "confirmed",
  "total_amount": 25.0,
  "created_at": "2024-01-15T17:50:00Z",
  "updated_at": "2024-01-15T17:55:00Z",
  "confirmed_at": "2024-01-15T17:55:00Z"
}
```

---

### 9. **booking_seats** Table

**Purpose:** Junction table linking bookings to specific seats

| Column        | Type          | Description              | Constraints              |
| ------------- | ------------- | ------------------------ | ------------------------ |
| `id`          | UUID          | Primary key              | Auto-generated           |
| `booking_id`  | UUID          | Foreign key to bookings  | NOT NULL, CASCADE DELETE |
| `seat_id`     | UUID          | Foreign key to seats     | NOT NULL, CASCADE DELETE |
| `showtime_id` | UUID          | Foreign key to showtimes | NOT NULL, CASCADE DELETE |
| `price`       | DECIMAL(10,2) | Price for this seat      | NOT NULL, >= 0           |
| `created_at`  | TIMESTAMP     | Creation time            | Auto-set                 |

**Example Data:**

```json
{
  "id": "923e4567-e89b-12d3-a456-426614174000",
  "booking_id": "823e4567-e89b-12d3-a456-426614174000",
  "seat_id": "623e4567-e89b-12d3-a456-426614174000",
  "showtime_id": "523e4567-e89b-12d3-a456-426614174000",
  "price": 12.5,
  "created_at": "2024-01-15T17:55:00Z"
}
```

---

## 🔗 Table Relationships (How They Connect)

### Visual Relationship Diagram:

```
users
  │
  ├───► bookings (One user can have many bookings)
  │         │
  │         ├───► booking_seats (One booking has many seats)
  │         │         │
  │         │         ├───► seats (Many booking_seats link to one seat)
  │         │         └───► showtimes (Many booking_seats link to one showtime)
  │         │
  │         └───► showtimes (One booking links to one showtime)
  │
  └───► seat_reservations (One user can have many reservations)
            │
            ├───► showtimes (One reservation links to one showtime)
            └───► seats (One reservation links to one seat)

theaters
  │
  └───► screens (One theater has many screens)
          │
          ├───► seats (One screen has many seats)
          │       │
          │       ├───► booking_seats (One seat can be in many bookings)
          │       └───► seat_reservations (One seat can have many reservations)
          │
          └───► showtimes (One screen has many showtimes)
                  │
                  ├───► movies (One showtime links to one movie)
                  ├───► bookings (One showtime can have many bookings)
                  ├───► booking_seats (One showtime can have many booking_seats)
                  └───► seat_reservations (One showtime can have many reservations)

movies
  │
  └───► showtimes (One movie can have many showtimes)
```

---

## 📋 Relationship Details:

### **One-to-Many Relationships:**

1. **Theater → Screens**

   - One theater has many screens
   - Foreign key: `screens.theater_id` → `theaters.id`
   - Delete: CASCADE (delete theater = delete all screens)

2. **Screen → Seats**

   - One screen has many seats
   - Foreign key: `seats.screen_id` → `screens.id`
   - Delete: CASCADE

3. **Screen → Showtimes**

   - One screen has many showtimes
   - Foreign key: `showtimes.screen_id` → `screens.id`
   - Delete: CASCADE

4. **Movie → Showtimes**

   - One movie can show at many times
   - Foreign key: `showtimes.movie_id` → `movies.id`
   - Delete: CASCADE

5. **User → Bookings**

   - One user can make many bookings
   - Foreign key: `bookings.user_id` → `users.id`
   - Delete: CASCADE

6. **Showtime → Bookings**

   - One showtime can have many bookings
   - Foreign key: `bookings.showtime_id` → `showtimes.id`
   - Delete: CASCADE

7. **Booking → BookingSeats**

   - One booking can have many seats
   - Foreign key: `booking_seats.booking_id` → `bookings.id`
   - Delete: CASCADE

8. **Seat → BookingSeats**

   - One seat can be booked multiple times (different showtimes)
   - Foreign key: `booking_seats.seat_id` → `seats.id`
   - Delete: CASCADE

9. **Showtime → BookingSeats**

   - One showtime can have many booked seats
   - Foreign key: `booking_seats.showtime_id` → `showtimes.id`
   - Delete: CASCADE

10. **Showtime → SeatReservations**

    - One showtime can have many reservations
    - Foreign key: `seat_reservations.showtime_id` → `showtimes.id`
    - Delete: CASCADE

11. **Seat → SeatReservations**

    - One seat can have many reservations (different times)
    - Foreign key: `seat_reservations.seat_id` → `seats.id`
    - Delete: CASCADE

12. **User → SeatReservations**
    - One user can have many reservations
    - Foreign key: `seat_reservations.user_id` → `users.id`
    - Delete: SET NULL (keep reservation if user deleted)

---

## 🎯 Key Concepts:

### **Why booking_seats is a junction table:**

- A booking can have multiple seats (user books 3 seats)
- A seat can be in multiple bookings (different showtimes)
- This is a **Many-to-Many** relationship between bookings and seats
- The `showtime_id` in `booking_seats` ensures seats are linked to the correct showtime

### **Why seat_reservations exists:**

- Temporary holds (5 minutes) before booking confirmation
- Prevents double-booking during the booking process
- Expires automatically if not confirmed

### **Data Flow Example:**

1. **User browses movies** → `movies` table
2. **User selects showtime** → `showtimes` table (links movie + screen + time)
3. **User selects seats** → `seats` table (belongs to screen)
4. **User reserves seats** → `seat_reservations` table (5-minute hold)
5. **User confirms booking** → `bookings` table
6. **Booking linked to seats** → `booking_seats` table (junction)

---

## 📊 Summary:

- **9 tables total**
- **Main entities:** users, theaters, screens, movies, seats, showtimes
- **Transaction tables:** bookings, booking_seats, seat_reservations
- **All relationships use UUID foreign keys**
- **CASCADE deletes** maintain data integrity
- **Timestamps** track creation and updates
