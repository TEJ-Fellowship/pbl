# 📝 Bipasana – Your Mental Well-being Journal

_"Inspired by Vipassana, Bipasana helps you reflect, track, and gain clarity in your daily life."_

**Category:** Health / Productivity

---

## 🌍 Overview

Bipasana is a platform for individuals to track their daily moods, write reflections, and receive motivational quotes or AI-powered insights.

**Users can:**

- ✅ Record daily reflections and feelings
- ✅ Track moods over time with visual summaries
- ✅ Receive motivational quotes or AI-powered insights

---

## 🧩 Tier 1: Basic Journal with API Integration (React + Node.js + Express)

### 🔹 Features:

- 📝 Create new journal entries with date, mood, and reflection text
- ✅ Edit or delete existing entries
- 📊 View a list of entries sorted by date
- 📱 Mobile-responsive UI with Tailwind CSS
- 🌓 Dark/light mode toggle
- 💡 Motivational Quotes: Fetch a daily motivational quote from a public API (like ZenQuotes or type.fit) and display it

### 🔹 Tech Stack:

- **Frontend:** React (useState, useContext, props, fetch/axios for API calls)
- **Backend:** Node.js + Express REST API
- **Database:** In-memory store (for later MongoDB integration)

### 🔹 Core Components:

- `EntryForm`
- `EntryList`
- `EntryItem`
- `MoodOverview`
- `QuoteCard`

### 🔹 Backend Routes (Postman-Testable):

- `POST /entries` → Create a journal entry
- `GET /entries` → Get all entries
- `PUT /entries/:id` → Update an entry
- `DELETE /entries/:id` → Delete an entry

### 🔹 API Integration:

- `GET /quotes` → Fetch a motivational quote from a public API

### 🔹 Optional Enhancements:

- Show a random quote each time the user opens the app
- Filter entries by mood

---

## 📍 Tier 2: Database Integration (MongoDB + Mongoose)

### 🔹 Features:

- 💾 Store all journal entries in MongoDB using Mongoose schemas
- 📊 Fetch entries by date or mood
- ✅ Persistent storage ensures entries remain after page reload

### 🔹 Tech Stack:

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose ODM)

### 🔹 Backend Routes (Postman-Testable):

- `POST /entries` → Create entry
- `GET /entries` → Fetch all entries
- `GET /entries/date/:date` → Fetch entries by date
- `GET /entries/mood/:mood` → Fetch entries by mood
- `PUT /entries/:id` → Update entry
- `DELETE /entries/:id` → Delete entry

### 🔹 Optional Enhancements:

- Filter entries by mood or date range
- Sort entries by mood intensity or date

---

## 🤖 Tier 3: AI-Powered Insights & Motivational Quotes

### 🔹 Features:

- 🧠 Suggest daily prompts or reflection questions based on mood
- 💡 Provide motivational quotes or mental well-being tips
- 📊 Show mood trends with visual charts
- 📝 Summarize weekly or monthly reflections

### 🔹 Tech Stack:

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express + MongoDB
- **AI Engine:** Optional GPT/Gemini API for prompts, insights, or quotes

### 🔹 Optional Enhancements:

- Calendar view for entries
- Export reflections or mood trends as PDF
- Daily email notifications with motivational quotes

---

## 🔐 Tier 4: User Authentication & Access Control

### 🔹 Features:

- **User Registration & Login:** Secure sign-up and login functionality
- **JWT-based authentication:** Users stay logged in securely
- **Password hashing:** Use bcrypt for storing passwords safely
- **Protected routes:** Entries are only accessible to authenticated users
- **Optional role-based access:** Personal vs shared journal access
- **Profile management:** Users can update name, email, and password

### 🔹 Tech Stack:

- **Frontend:** React + Tailwind CSS (Login/Signup forms, protected routes)
- **Backend:** Node.js + Express + MongoDB (Users collection)
- **Authentication:** JWT + bcrypt
- **Optional:** Passport.js for OAuth (Google login)

### 🔹 Backend Routes (Postman-Testable):

- `POST /auth/register` → Register new user
- `POST /auth/login` → Login user
- `GET /auth/me` → Get current logged-in user info
- Protected entry routes (`GET /entries`, `POST /entries`, `PUT /entries/:id`, `DELETE /entries/:id`)

### 🔹 Optional Enhancements:

- Email verification for new users
- Password reset via email
- Role-based access control for shared journals or groups
