# Stripe Customer Support Agent - Backend

A simple Node.js backend API for the Stripe Customer Support Agent application.

## Features

- **Simple API**: Basic support ticket endpoints
- **CORS Support**: Cross-origin resource sharing enabled
- **Easy to use**: Minimal setup required

## API Endpoints

- `GET /` - Server status
- `GET /api/tickets` - Get all support tickets
- `POST /api/tickets` - Create a new support ticket

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

The server will start on `http://localhost:5000`

## Project Structure

```
Backend/
├── index.js          # Main server file
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

## Development

The server uses `nodemon` for automatic restarts during development.
