# 📌 ShramSathi – Community Flow Management

## 📖 Overview

**CommunityFlow (ShramSathi)** is a community-based task and program management platform designed to help users organize tasks, manage programs, get AI-based suggestions, and track progress. It provides a dashboard view, task manager, program manager, AI integration, and an overview analytics section.

---

## 🛠️ Features

- **Dashboard** – Quick overview of tasks, programs, and progress.
- **Programs** – Create, view, and manage community programs.
- **Tasks** – Add, assign, and track tasks with deadlines.
- **AI Suggestion (Gemini)** – Smart suggestions for community workflows.
- **Overview (Analytics)** – Insights into task completion and pending work.
- **Authentication (JWT & Bcrypt)** – Secure login and user management.
- **Database (MongoDB)** – Store users, tasks, and programs with relationships.

---

## ⚙️ Tech Stack

- **Frontend:** React + TailwindCSS + Lucide Icons
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose ORM)
- **AI Integration:** Google Gemini API
- **Authentication:** JWT + Bcrypt
- **File Handling:** Multer

---

## Installation & Setup

1. **Clone the Repository**

```bash
    git clone git@github.com:TEJ-Fellowship/pbl.git
    cd pbl/pbl2/ShramSathi
```

2. **Backend Setup**

```bash
cd backend
npm install
npm run server
```

3. **Frontend Setup**

```bash
cd frontend
npm install
npm run dev
```

4. **Environment Variables**

Create a `.env` file inside **_backend/_**

```env
PORT=your port here
GEMINI_API_KEY= Your gemini api key here
SECRET_KEY= your secret key
```

## Usage Examples

1. **Add a Task**
   - **POST** `/api/tasks/`
   ```json
   {
     "taskName": "Community Clean-up",
     "description": "Clean up local park",
     "date": "2025-09-05",
     "category": "Social Work",
     "assignee": "John Doe",
     "programId": "64f6abc1234example"
   }
   ```
2. **Get all Programs with Tasks**

   - **GET** `api/programs`

   _Response_

   ```json
   [
     {
       "_id": "64f6abc1234example",
       "title": "Park Renovation",
       "description": "Community park improvement",
       "tasks": [{ "taskName": "Clean-up", "completed": false }]
     }
   ]
   ```

3. **Register User**
   - **POST** `/auth/register`
   ```json
   {
     "username": "bijay",
     "email": "bijay@example.com",
     "password": "securepassword"
   }
   ```
4. **Login User**
   - **POST** `/auth/login`
   ```json
   {
     "email": "bijay@example.com",
     "password": "securepassword"
   }
   ```
   _Response_
   ```json
   {
     "message": "Login successfull",
     "token": "jwt-token-here"
   }
   ```

## Future Improvments

- Role-based access (Admin, User)
- Real time update with WebSockets
- Push Notification
- Mobile-friendly PWA support
