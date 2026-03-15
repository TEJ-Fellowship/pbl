📘 SkillUp-AI — AI-Powered Learning Assistant ( Sushil )

SkillUp-AI is an interactive learning platform that helps users master programming by chatting with an AI tutor, generating quizzes, and receiving personalized guidance based on their chosen programming language.

This project was built as part of the TEJ Fellowship (2025) and follows modern full-stack standards using React, Node.js, Express, MongoDB, and Gemini API.

🚀 Features<br>
🧠 AI Learning Assistant<br>

Users can chat with an AI tutor in real time.<br>
Explanations, debugging help, and programming guidance.<br>

📚 Select Preferred Programming Language<br>
Users choose their desired programming language (JavaScript, Python, C++, etc.)<br>
AI responses adapt to the selected language.<br>

📝 Auto-Generated Quizzes<br>
Generate multiple-choice questions based on conversation context.<br>
Helps reinforce learning.<br>

👤 User Authentication<br>
Login / Signup<br>
JWT-based authentication<br>
Secure password hashing<br>

📊 User Progress Tracking<br>
Stores user history and quiz data<br>
Personalized recommendations (future scope)<br>

🛠️ Tech Stack<br>
### Frontend<br>

- **React.js** (v18+) - UI library<br>
- **React Router** - Client-side routing<br>
- **Axios** - HTTP client for API requests<br>
- **Tailwind CSS** - Styling<br>
- **React Context API** - State management<br>

### Backend<br>

- **Node.js** (v16+) - Runtime environment<br>
- **Express.js** - Web application framework<br>
- **MongoDB** - NoSQL database<br>
- **Mongoose** - MongoDB object modeling<br>
- **JWT** - Authentication and authorization<br>
- **Bcrypt.js** - Password hashing<br>
- **Gemini API** <br>


🏗️ System Architecture<br>
Frontend (React)<br>
       ↓  Axios<br>
Backend (Node + Express)<br>
       ↓<br>
MongoDB (Database)<br>
       ↓<br>
Gemini API (AI Responses + Quiz Generation)<br>



⚙️ Installation & Setup Guide<br>

### Prerequisites<br>
- Node.js (v16 or higher)<br>
- MongoDB (v4.4 or higher)<br>
- npm package manager<br>
- Git<br>

📌 1. Clone the Repository<br>
git clone https://github.com/me-Sushil/SkillUp-AI.git<br>
cd SkillUp-AI<br>

📌 2. Install dependencies:<br>

📌  Setup Frontend<br>
Go to the frontend folder:<br>
cd frontend<br>
npm install<br>

📌  Setup Backend<br>
Go to the backend folder:<br>
cd frontend<br>
npm install<br>


✅ Create .env file<br>

1. Create a .env file inside frontend folder:<br>

VITE_LOGIN_URL="http://localhost:3001/api/auth/login"<br>
VITE_REGISTER_URL="http://localhost:3001/api/auth/register"<br>
VITE_VALIDATE_TOKEN_URL="http://localhost:3001/api/auth/validate-token"<br>
VITE_AI_URL="http://localhost:3001/api/chat/chats"<br>
VITE_USER_CHATS="http://localhost:3001/api/user/chats"<br>
VITE_USER_QUIZE="http://localhost:3001/api/user/quiz"<br>


Frontend runs on:<br>
http://localhost:5173<br>

Start frontend:<br>
npm run dev<br>

2. Create a .env file inside backend folder:<br>

MONGODB_URL=Your Mongodb URL , like ("mongodb+srv://skillup-ai:skillup-ai@cluster0.4hhfkup.mongodb.net/skillUp-AI?retryWrites=true&w=majority&skillUpAI=Cluster0")<br>
PORT=3001<br>
JWT_SECRET="!2djS%$@LJLrd13*6%^&*nmNBdnGHFGD!@#7VcxcsWERTyu65#$%vcdfWER"<br>
GEMINI_API_KEY=Gemini API key , Like ("AIzaSyBVKEdOgEIx1RMMpnW-3Qu3yQxewCuEYcY")<br>


Backend runs on:<br>
http://localhost:3001<br>

Start backend:<br>
npm run dev<br>


🧩 Common Errors & Solutions<br>
❌ MongoDB connection failed<br>
✔ Check your MONGO_URI<br>
✔ Ensure IP access is allowed in MongoDB Atlas<br>


❌ OpenAI API not responding<br>
✔ Check your GEMINI_API_KEY<br>
✔ Ensure billing is active<br>

CONNECT WITH ME :<br>
LinkedIn : https://www.linkedin.com/in/me-sushil/
