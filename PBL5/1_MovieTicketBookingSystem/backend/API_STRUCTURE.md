# API Structure Documentation

## Base URL

```
http://localhost:3001/api
```

## Server Information

- **Default Port:** 3001 (configurable via `PORT` environment variable)
- **Health Check:** `GET /health`
- **Root Endpoint:** `GET /` (returns API information)

## Quick Start

1. Start the server: `npm run dev`
2. Check health: `GET http://localhost:3001/health`
3. View API info: `GET http://localhost:3001/`

## API Endpoints Overview

### 1. Movies API (`/api/movies`)

| Method | Endpoint             | Description          | Status Codes |
| ------ | -------------------- | -------------------- | ------------ |
| GET    | `/api/movies`        | Get all movies       | 200          |
| GET    | `/api/movies/search` | Search/filter movies | 200          |
| GET    | `/api/movies/:id`    | Get movie by ID      | 200, 404     |
| POST   | `/api/movies`        | Create new movie     | 201, 400     |
| PUT    | `/api/movies/:id`    | Update movie         | 200, 404     |
| DELETE | `/api/movies/:id`    | Delete movie         | 204, 404     |

**Search Query Parameters:**

- `title` - Search by title (case-insensitive partial match)
- `genre` - Filter by genre (exact match)
- `language` - Filter by language (exact match)
- `release_date` - Filter by release date (exact match)

**Example:**

```
GET /api/movies/search?title=avengers&genre=Action
```

---

### 2. Theaters API (`/api/theaters`)

| Method | Endpoint            | Description        | Status Codes |
| ------ | ------------------- | ------------------ | ------------ |
| GET    | `/api/theaters`     | Get all theaters   | 200          |
| GET    | `/api/theaters/:id` | Get theater by ID  | 200, 404     |
| POST   | `/api/theaters`     | Create new theater | 201, 400     |
| PUT    | `/api/theaters/:id` | Update theater     | 200, 404     |
| DELETE | `/api/theaters/:id` | Delete theater     | 204, 404     |

---

### 3. Screens API (`/api/screens`)

| Method | Endpoint                          | Description            | Status Codes |
| ------ | --------------------------------- | ---------------------- | ------------ |
| GET    | `/api/screens`                    | Get all screens        | 200          |
| GET    | `/api/screens/theater/:theaterId` | Get screens by theater | 200          |
| GET    | `/api/screens/:id`                | Get screen by ID       | 200, 404     |
| POST   | `/api/screens`                    | Create new screen      | 201, 400     |
| PUT    | `/api/screens/:id`                | Update screen          | 200, 404     |
| DELETE | `/api/screens/:id`                | Delete screen          | 204, 404     |

---

### 4. Showtimes API (`/api/showtimes`)

| Method | Endpoint                            | Description              | Status Codes |
| ------ | ----------------------------------- | ------------------------ | ------------ |
| GET    | `/api/showtimes`                    | Get all showtimes        | 200          |
| GET    | `/api/showtimes/movie/:movieId`     | Get showtimes by movie   | 200          |
| GET    | `/api/showtimes/theater/:theaterId` | Get showtimes by theater | 200          |
| GET    | `/api/showtimes/:id`                | Get showtime by ID       | 200, 404     |
| POST   | `/api/showtimes`                    | Create new showtime      | 201, 400     |
| PUT    | `/api/showtimes/:id`                | Update showtime          | 200, 404     |
| DELETE | `/api/showtimes/:id`                | Delete showtime          | 204, 404     |

---

### 5. Bookings API (`/api/bookings`)

| Method | Endpoint                     | Description               | Status Codes  |
| ------ | ---------------------------- | ------------------------- | ------------- |
| GET    | `/api/bookings`              | Get all bookings          | 200           |
| GET    | `/api/bookings/user/:userId` | Get bookings by user      | 200           |
| GET    | `/api/bookings/:id`          | Get booking by ID         | 200, 404      |
| POST   | `/api/bookings`              | Create new booking        | 201, 400, 404 |
| POST   | `/api/bookings/reserve`      | Reserve seats temporarily | 201, 409      |
| POST   | `/api/bookings/confirm/:id`  | Confirm booking           | 200, 404      |
| PUT    | `/api/bookings/:id`          | Update booking status     | 200, 404      |
| DELETE | `/api/bookings/:id`          | Cancel booking            | 204, 404      |

**Reserve Seats Request Body:**

```json
{
  "showtime_id": "uuid",
  "seat_ids": ["uuid1", "uuid2"],
  "user_id": "uuid"
}
```

**Create Booking Request Body:**

```json
{
  "user_id": "uuid",
  "showtime_id": "uuid",
  "seat_ids": ["uuid1", "uuid2"]
}
```

---

### 6. Payments API (`/api/payments`)

| Method | Endpoint                           | Description            | Status Codes       |
| ------ | ---------------------------------- | ---------------------- | ------------------ |
| POST   | `/api/payments/process`            | Process payment        | 200, 400, 402, 404 |
| GET    | `/api/payments/:id`                | Get payment by ID      | 200                |
| GET    | `/api/payments/booking/:bookingId` | Get payment by booking | 200, 404           |

**Process Payment Request Body:**

```json
{
  "booking_id": "uuid",
  "payment_method": "credit_card",
  "amount": 500.0
}
```

---

### 7. Users API (`/api/users`)

| Method | Endpoint         | Description     | Status Codes  |
| ------ | ---------------- | --------------- | ------------- |
| GET    | `/api/users`     | Get all users   | 200           |
| GET    | `/api/users/:id` | Get user by ID  | 200, 404      |
| POST   | `/api/users`     | Create new user | 201, 409      |
| PUT    | `/api/users/:id` | Update user     | 200, 404, 409 |
| DELETE | `/api/users/:id` | Delete user     | 204, 404      |

---

## Route Ordering Rules

**Important:** Specific routes must always come before parameterized routes to avoid conflicts.

### ✅ Correct Order:

```javascript
router.get("/search", controller.search); // Specific route first
router.get("/user/:userId", controller.getByUser); // Specific with param
router.get("/", controller.getAll); // List route
router.get("/:id", controller.getById); // Parameterized route last
```

### ❌ Incorrect Order:

```javascript
router.get("/:id", controller.getById); // This will match /search
router.get("/search", controller.search); // Never reached!
```

---

## Response Format

### Success Response

```json
{
  "id": "uuid",
  "field": "value",
  ...
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": "Additional error details (in development mode)"
}
```

### Validation Error Response

```json
{
  "error": "Validation error",
  "details": ["Field is required", "Invalid format"]
}
```

---

## Status Codes

| Code | Meaning               | Usage                              |
| ---- | --------------------- | ---------------------------------- |
| 200  | OK                    | Successful GET, PUT requests       |
| 201  | Created               | Successful POST requests           |
| 204  | No Content            | Successful DELETE requests         |
| 400  | Bad Request           | Invalid input, validation errors   |
| 402  | Payment Required      | Payment processing failed          |
| 404  | Not Found             | Resource not found                 |
| 409  | Conflict              | Duplicate entry, resource conflict |
| 500  | Internal Server Error | Server errors                      |

---

## API Structure Best Practices

1. **RESTful Design**: All endpoints follow REST conventions
2. **Consistent Naming**: All routes use kebab-case for multi-word paths
3. **Resource-Based URLs**: URLs represent resources, not actions
4. **HTTP Methods**: Proper use of GET, POST, PUT, DELETE
5. **Status Codes**: Appropriate HTTP status codes for all responses
6. **Error Handling**: Consistent error response format
7. **Route Ordering**: Specific routes before parameterized routes

---

## Notes

- All IDs are UUIDs (v4)
- All timestamps are in ISO 8601 format (UTC)
- All monetary values are in DECIMAL(10,2) format
- Seat reservations expire after 5 minutes
- Booking statuses: `pending`, `reserved`, `confirmed`, `cancelled`, `expired`
- Showtime statuses: `active`, `cancelled`, `completed`
- Seat types: `regular`, `premium`, `vip`
- Payment processing is simulated (not connected to real payment gateway)

---

## Route Ordering Best Practices

All routes follow this pattern to avoid conflicts:

1. **Specific routes first** (e.g., `/search`, `/reserve`, `/process`)
2. **Resource-specific routes** (e.g., `/user/:userId`, `/movie/:movieId`)
3. **List routes** (e.g., `GET /`)
4. **Parameterized routes last** (e.g., `GET /:id`)

This ensures specific routes are matched before generic parameterized routes.

---

**API Version:** 1.0.0
