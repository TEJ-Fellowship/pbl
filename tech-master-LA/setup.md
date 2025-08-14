# Quick Setup Guide

## Essential Steps to Get TechMaster Learning App Running

### 1. Create Environment Files

**Backend (.env in `backend/` folder):**

```env
PORT=5000
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=techmaster_la
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_123456789
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend (.env in `frontend/` folder):**

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies

```bash
# Backend
cd tech-master-LA/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Start MongoDB

**Local MongoDB:**

```bash
# Ubuntu/Debian
sudo systemctl start mongodb

# macOS (with Homebrew)
brew services start mongodb-community

# Windows
# Start MongoDB service from Services
```

**Or use MongoDB Atlas (cloud):**

- Sign up at https://www.mongodb.com/atlas
- Create a cluster
- Get connection string and update MONGODB_URL

### 4. Get Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add it to both .env files

### 5. Start the Application

```bash
# Terminal 1 - Backend
cd tech-master-LA/backend
npm run dev

# Terminal 2 - Frontend
cd tech-master-LA/frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### 7. Test the Application

1. Register a new account
2. Login with your credentials
3. Start a chat with the AI
4. Generate a quiz from the chat
5. Take the quiz and check your progress

## Common Issues & Solutions

### "Authentication not working"

- Check if JWT_SECRET is set in backend .env
- Ensure cookies are enabled in browser
- Clear browser cache and cookies

### "AI Chat not responding"

- Verify GEMINI_API_KEY is set correctly
- Check if the API key has proper permissions
- Ensure internet connection

### "Database connection failed"

- Verify MongoDB is running
- Check MONGODB_URL in backend .env
- Ensure database exists

### "Frontend can't connect to backend"

- Verify VITE_API_BASE_URL in frontend .env
- Check if backend is running on port 5000
- Ensure CORS is properly configured

## Features Working After Setup

✅ **Authentication System**

- User registration and login
- JWT token-based authentication
- Secure logout functionality

✅ **AI Chat Integration**

- Real-time chat with Gemini AI
- Conversation history
- Chat-based quiz generation

✅ **Quiz System**

- Automatic quiz generation from chat
- Interactive quiz interface
- Score tracking and attempts

✅ **Progress Tracking**

- User-specific statistics
- Performance metrics
- Quiz history and scores

✅ **Modern UI**

- Responsive design
- Dark theme
- Smooth animations

## Next Steps

1. Customize the UI theme
2. Add more quiz types
3. Implement advanced analytics
4. Add user profiles
5. Enable social features
