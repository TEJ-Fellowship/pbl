# TechMaster Learning App

An AI-powered learning platform with chat functionality, quiz generation, and progress tracking.

## Features

- 🔐 **Authentication System**: Secure login/register with JWT tokens
- 🤖 **AI Chat**: Powered by Google Gemini AI
- 📝 **Quiz Generation**: Automatic quiz generation from chat history
- 📊 **Progress Tracking**: User-specific statistics and performance metrics
- 🎯 **Smart Quizzes**: Interactive quiz interface with scoring
- 📱 **Responsive Design**: Modern UI with Tailwind CSS

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or cloud instance)
- Google Gemini API key

## Setup Instructions

### 1. Environment Configuration

#### Backend (.env file in `backend/` directory)

```env
PORT=5000
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=techmaster_la
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

#### Frontend (.env file in `frontend/` directory)

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Backend Setup

```bash
cd tech-master-LA/backend

# Install dependencies
npm install

# Start the server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd tech-master-LA/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify authentication

### Chat

- `POST /api/chat/conversation` - Create new conversation
- `POST /api/chat/message` - Send message
- `POST /api/chat/generate-quiz` - Generate quiz from conversation
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/conversations/:id` - Get specific conversation
- `DELETE /api/chat/conversations/:id` - Delete conversation

### Quizzes

- `GET /api/quiz` - Get all quizzes
- `POST /api/quiz` - Create new quiz
- `GET /api/quiz/:id` - Get specific quiz
- `PUT /api/quiz/:id` - Update quiz
- `POST /api/quiz/:id/attempt` - Record quiz attempt
- `DELETE /api/quiz/:id` - Delete quiz

### Statistics

- `GET /api/stats` - Get user statistics

## Database Models

### User

- name, email, password, phone

### Conversation

- userId, messages[], topic, timestamps

### Quiz

- userId, title, topic, questions[], attempts[]

## Troubleshooting

### Common Issues

1. **Authentication not working**

   - Check if JWT_SECRET is set in backend .env
   - Ensure cookies are enabled in browser
   - Verify CORS configuration

2. **AI Chat not responding**

   - Verify GEMINI_API_KEY is set correctly
   - Check if the API key has proper permissions
   - Ensure internet connection

3. **Database connection issues**

   - Verify MongoDB is running
   - Check MONGODB_URL in backend .env
   - Ensure database exists

4. **Frontend not connecting to backend**
   - Verify VITE_API_BASE_URL in frontend .env
   - Check if backend is running on correct port
   - Ensure CORS is properly configured

### Getting Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to both backend and frontend .env files

### MongoDB Setup

#### Local MongoDB

```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt update
sudo apt install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and update MONGODB_URL

## Project Structure

```
tech-master-LA/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── middlewares/    # Custom middlewares
│   ├── utils/          # Utility functions
│   └── config/         # Configuration files
└── frontend/
    ├── src/
    │   ├── components/ # React components
    │   ├── pages/      # Page components
    │   ├── services/   # API services
    │   ├── api/        # API functions
    │   └── config/     # Configuration
    └── public/         # Static assets
```

## Development

### Adding New Features

1. Create backend route in `routes/`
2. Add controller in `controllers/`
3. Create service in `services/` if needed
4. Add frontend component in `components/`
5. Update API calls in `api/` or `services/`

### Code Style

- Use ES6+ features
- Follow RESTful API conventions
- Use meaningful variable names
- Add proper error handling
- Include JSDoc comments for functions

## Deployment

### Backend Deployment

- Use environment variables for production
- Set NODE_ENV=production
- Use secure JWT secret
- Enable HTTPS

### Frontend Deployment

- Build with `npm run build`
- Serve static files
- Update API base URL for production

## License

This project is licensed under the MIT License.
