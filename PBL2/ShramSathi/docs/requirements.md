# 📝 ShramSathi – Your Intelligent Community Task Manager

_"Don’t just volunteer — volunteer smartly with ShramSathi."_

**Category:** Productivity / Community

---

## 🌍 Overview

ShramSathi is a platform for small teams, NGOs, or student groups to create, organize, and track tasks efficiently.

**Users can:**

- ✅ Add and manage tasks
- ✅ Organize tasks by day or category
- ✅ Track progress with completed/incomplete status
- ✅ Get AI-powered or smart suggestions for high-priority tasks (optional)

---

## 🧩 Tier 1: Basic Task Manager (React + Node.js + Express)

### 🔹 Features:

- 📝 Create new tasks with title, description, due date, and optional assignee
- ✅ Mark tasks as “completed” for progress tracking
- 🗂️ View tasks grouped by day or category
- 📱 Mobile-responsive UI using Tailwind CSS
- 🌓 Dark/light mode toggle

### 🔹 Tech Stack:

- **Frontend:** React (useState, useContext, props)
- **Backend:** Node.js + Express REST API
- **Database:** In-memory store (for later MongoDB integration)

### 🔹 Core Components:

- `TaskForm`
- `TaskList`
- `TaskItem`
- `TaskOverview`

### 🔹 Backend Routes (Postman-Testable):

- `POST /tasks` → Create a task
- `GET /tasks` → Get all tasks
- `PUT /tasks/:id` → Update task
- `DELETE /tasks/:id` → Delete task

---

## 📍 Tier 2: Database Integration (MongoDB + Mongoose)

### 🔹 Features:

- 💾 Store all tasks in MongoDB using Mongoose schemas
- 🗂️ Fetch tasks by category or day
- ✅ Persistent storage ensures tasks remain after page reload

### 🔹 Tech Stack:

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose ODM)

### 🔹 Backend Routes (Postman-Testable):

- `POST /tasks` → Create task
- `GET /tasks` → Fetch all tasks
- `GET /tasks/day/:date` → Fetch tasks by day
- `GET /tasks/category/:category` → Fetch tasks by category
- `PUT /tasks/:id` → Update task
- `DELETE /tasks/:id` → Delete task

### 🔹 Optional Enhancements:

- Sort tasks by due date or priority
- Filter tasks by completion status

---

## 🤖 Tier 3: AI-Powered Smart Suggestions

### 🔹 Features:

- 🧠 Suggest which tasks to prioritize based on due date or importance
- 🔄 Highlight overdue or high-priority tasks
- 📝 Summarize daily or weekly progress
- 📊 Visual charts for task completion trends

### 🔹 Tech Stack:

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express + MongoDB
- **AI Suggestion Engine:** Optional integration with GPT/Gemini API for prioritization

### 🔹 Optional Enhancements:

- Calendar view for tasks
- Export task summaries as PDF or shareable links

---

## 🔐 Tier 4: User Authentication & Access Control

### 🔹 Features:

- **User Registration & Login:** Secure sign-up and login functionality
- **JWT-based authentication:** Users stay logged in securely
- **Password hashing:** Use bcrypt for storing passwords safely
- **Protected routes:** Tasks are only accessible to authenticated users
- **Optional role-based access:** Admin vs member access for tasks and teams
- **Profile management:** Users can update their name, email, and password

### 🔹 Tech Stack:

- **Frontend:** React + Tailwind CSS (Login/Signup forms, protected routes)
- **Backend:** Node.js + Express + MongoDB (Users collection)
- **Authentication:** JWT + bcrypt
- **Optional:** Passport.js for OAuth (Google login)

### 🔹 Backend Routes (Postman-Testable):

- `POST /auth/register` → Register new user
- `POST /auth/login` → Login user
- `GET /auth/me` → Get current logged-in user info
- Protected task routes (`GET /tasks`, `POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`)

### 🔹 Optional Enhancements:

- Email verification for new users
- Password reset via email
- Role-based access control for teams/projects
